import { createHash } from "node:crypto";
import { promises as fs } from "fs";
import path from "path";

import { redisCommand, redisConfig } from "@/lib/server/redis";

const DEV_FILE = path.join(process.cwd(), ".votes.json");
// Network addresses are only an abuse signal: allow a few fresh voters behind a shared NAT.
const MAX_VOTERS_PER_CLIENT_WINDOW = 3;
// Three bits in a fixed 128 KiB bitmap bound per-post idempotency storage.
const VOTER_FILTER_BITS = 1_048_576;
const LEGACY_VOTER_TTL_SECONDS = 60 * 60 * 24 * 365;
const CLIENT_ABUSE_TTL_SECONDS = 60 * 60 * 24 * 30;
const VOTE_RATE_LIMIT = 10;
const VOTE_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const ADD_VOTE_SCRIPT = [
  "#!lua flags=allow-key-locking",
  "local total = tonumber(redis.call('GET', KEYS[3]) or '0')",
  "local legacy_exists = redis.call('EXISTS', KEYS[4])",
  "if legacy_exists == 1 and redis.call('TTL', KEYS[4]) < 0 then redis.call('EXPIRE', KEYS[4], ARGV[8]) end",
  "local seen = redis.call('GETBIT', KEYS[1], ARGV[1]) == 1 and redis.call('GETBIT', KEYS[1], ARGV[2]) == 1 and redis.call('GETBIT', KEYS[1], ARGV[3]) == 1",
  "local legacy_seen = legacy_exists == 1 and redis.call('SISMEMBER', KEYS[4], ARGV[7]) == 1",
  "if seen or legacy_seen then",
  "  redis.call('SETBIT', KEYS[1], ARGV[1], 1)",
  "  redis.call('SETBIT', KEYS[1], ARGV[2], 1)",
  "  redis.call('SETBIT', KEYS[1], ARGV[3], 1)",
  "  return {total, 1, 'existing', 0}",
  "end",
  "if redis.call('SISMEMBER', KEYS[2], ARGV[4]) == 0 and redis.call('SCARD', KEYS[2]) >= tonumber(ARGV[5]) then",
  "  local ttl = redis.call('TTL', KEYS[2])",
  "  return {total, 0, 'client_limit', ttl}",
  "end",
  "redis.call('SETBIT', KEYS[1], ARGV[1], 1)",
  "redis.call('SETBIT', KEYS[1], ARGV[2], 1)",
  "redis.call('SETBIT', KEYS[1], ARGV[3], 1)",
  "redis.call('SADD', KEYS[2], ARGV[4])",
  "if redis.call('TTL', KEYS[2]) < 0 then redis.call('EXPIRE', KEYS[2], ARGV[6]) end",
  "return {redis.call('INCR', KEYS[3]), 1, 'added', 0}",
].join("\n");
const GET_VOTE_STATE_SCRIPT = [
  "#!lua flags=allow-key-locking",
  "local total = tonumber(redis.call('GET', KEYS[2]) or '0')",
  "local legacy_exists = redis.call('EXISTS', KEYS[3])",
  "if legacy_exists == 1 and redis.call('TTL', KEYS[3]) < 0 then redis.call('EXPIRE', KEYS[3], ARGV[5]) end",
  "local seen = redis.call('GETBIT', KEYS[1], ARGV[1]) == 1 and redis.call('GETBIT', KEYS[1], ARGV[2]) == 1 and redis.call('GETBIT', KEYS[1], ARGV[3]) == 1",
  "local legacy_seen = legacy_exists == 1 and redis.call('SISMEMBER', KEYS[3], ARGV[4]) == 1",
  "if legacy_seen then",
  "  redis.call('SETBIT', KEYS[1], ARGV[1], 1)",
  "  redis.call('SETBIT', KEYS[1], ARGV[2], 1)",
  "  redis.call('SETBIT', KEYS[1], ARGV[3], 1)",
  "end",
  "return {total, (seen or legacy_seen) and 1 or 0}",
].join("\n");
const VOTE_RATE_LIMIT_SCRIPT = [
  "#!lua flags=allow-key-locking",
  "local current = redis.call('INCR', KEYS[1])",
  "if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
  "local ttl = redis.call('TTL', KEYS[1])",
  "if ttl < 0 then redis.call('EXPIRE', KEYS[1], ARGV[1]); ttl = tonumber(ARGV[1]) end",
  "return {current, ttl}",
].join("\n");

export type VoteState = {
  votes: number;
  voted: boolean;
}

export class VoteStoreNotConfiguredError extends Error {
  constructor() {
    super("Vote storage is not configured");
  }
}

export class VoteRateLimitExceededError extends Error {
  readonly retryAfter: number;

  constructor(retryAfter: number) {
    super("Vote rate limit reached");
    this.retryAfter = Math.max(1, retryAfter);
  }
}

type DevVoteRecord = {
  votes: number;
  voters: string[];
  clients: string[];
};

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function voteRecord(value: unknown): DevVoteRecord {
  if (typeof value === "number") {
    return { votes: value, voters: [], clients: [] };
  }
  if (
    typeof value === "object" &&
    value !== null &&
    typeof Reflect.get(value, "votes") === "number" &&
    Array.isArray(Reflect.get(value, "voters"))
  ) {
    return {
      votes: Reflect.get(value, "votes") as number,
      voters: (Reflect.get(value, "voters") as unknown[]).filter(
        (voter): voter is string => typeof voter === "string",
      ),
      clients: Array.isArray(Reflect.get(value, "clients"))
        ? (Reflect.get(value, "clients") as unknown[]).filter(
            (client): client is string => typeof client === "string",
          )
        : [],
    };
  }
  return { votes: 0, voters: [], clients: [] };
}

async function readDevFile(): Promise<Record<string, DevVoteRecord>> {
  try {
    const raw = JSON.parse(await fs.readFile(DEV_FILE, "utf8")) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(raw).map(([slug, value]) => [slug, voteRecord(value)]));
  } catch {
    return {};
  }
}

function assertStoreConfigured(): void {
  if (isProduction() && !redisConfig()) {
    throw new VoteStoreNotConfiguredError();
  }
}

function voterBitOffsets(voterId: string): [number, number, number] {
  const digest = createHash("sha256").update(voterId).digest();
  return [0, 4, 8].map((offset) => digest.readUInt32BE(offset) % VOTER_FILTER_BITS) as [
    number,
    number,
    number,
  ];
}

export async function getVoteState(
  slug: string,
  voterId: string,
  legacyVoterId = voterId,
): Promise<VoteState> {
  assertStoreConfigured();

  if (redisConfig()) {
    const offsets = voterBitOffsets(voterId);
    const [votes, votedByVoter] = await redisCommand<(string | number | null)[]>([
      "EVAL",
      GET_VOTE_STATE_SCRIPT,
      3,
      `votes:voters:v3:${slug}`,
      `votes:${slug}`,
      `votes:voters:${slug}`,
      ...offsets,
      legacyVoterId,
      LEGACY_VOTER_TTL_SECONDS,
    ]);
    return {
      votes: Number(votes) || 0,
      voted: Number(votedByVoter) === 1,
    };
  }

  const votes = await readDevFile();
  const record = votes[slug] ?? { votes: 0, voters: [], clients: [] };
  return {
    votes: record.votes,
    voted: record.voters.includes(voterId),
  };
}

export async function addVote(
  slug: string,
  voterId: string,
  clientFingerprint = voterId,
  legacyVoterId = voterId,
): Promise<VoteState> {
  assertStoreConfigured();

  if (redisConfig()) {
    const offsets = voterBitOffsets(voterId);
    const result = await redisCommand<(string | number | null)[]>([
      "EVAL",
      ADD_VOTE_SCRIPT,
      4,
      `votes:voters:v3:${slug}`,
      `votes:abuse:${slug}:${clientFingerprint}`,
      `votes:${slug}`,
      `votes:voters:${slug}`,
      ...offsets,
      voterId,
      MAX_VOTERS_PER_CLIENT_WINDOW,
      CLIENT_ABUSE_TTL_SECONDS,
      legacyVoterId,
      LEGACY_VOTER_TTL_SECONDS,
    ]);
    const outcome = result[2];
    if (outcome === "client_limit") {
      throw new VoteRateLimitExceededError(Number(result[3]) || CLIENT_ABUSE_TTL_SECONDS);
    }
    return { votes: Number(result[0]) || 0, voted: Number(result[1]) === 1 };
  }

  const votes = await readDevFile();
  const record = votes[slug] ?? { votes: 0, voters: [], clients: [] };
  if (!record.voters.includes(voterId)) {
    record.voters.push(voterId);
    record.votes += 1;
    votes[slug] = record;
    await fs.writeFile(DEV_FILE, JSON.stringify(votes, null, 2));
  }
  return { votes: record.votes, voted: true };
}

export async function consumeVoteRateLimit(
  slug: string,
  clientFingerprint: string,
): Promise<{ allowed: boolean; retryAfter: number }> {
  assertStoreConfigured();
  if (!redisConfig()) return { allowed: true, retryAfter: 0 };

  const [count, remainingSeconds] = await redisCommand<[number, number]>([
    "EVAL",
    VOTE_RATE_LIMIT_SCRIPT,
    1,
    `votes:rate:${slug}:${clientFingerprint}`,
    VOTE_RATE_LIMIT_WINDOW_SECONDS,
  ]);
  return {
    allowed: count <= VOTE_RATE_LIMIT,
    retryAfter: Math.max(0, remainingSeconds),
  };
}
