import { promises as fs } from "fs";
import path from "path";

import { redisCommand, redisConfig } from "@/lib/server/redis";

const DEV_FILE = path.join(process.cwd(), ".votes.json");
const ADD_VOTE_SCRIPT = [
  "local added = redis.call('SADD', KEYS[1], ARGV[1])",
  "local votes",
  "if added == 1 then",
  "  votes = redis.call('INCR', KEYS[2])",
  "else",
  "  votes = redis.call('GET', KEYS[2]) or 0",
  "end",
  "return {votes, 1}",
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

type DevVoteRecord = {
  votes: number;
  voters: string[];
};

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function voteRecord(value: unknown): DevVoteRecord {
  if (typeof value === "number") {
    return { votes: value, voters: [] };
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
    };
  }
  return { votes: 0, voters: [] };
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

export async function getVoteState(slug: string, voterId: string): Promise<VoteState> {
  assertStoreConfigured();

  if (redisConfig()) {
    const votes = await redisCommand<string | number | null>(["GET", `votes:${slug}`]);
    const voted = await redisCommand<number>(["SISMEMBER", `votes:voters:${slug}`, voterId]);
    return { votes: Number(votes) || 0, voted: Number(voted) === 1 };
  }

  const votes = await readDevFile();
  const record = votes[slug] ?? { votes: 0, voters: [] };
  return { votes: record.votes, voted: record.voters.includes(voterId) };
}

export async function addVote(slug: string, voterId: string): Promise<VoteState> {
  assertStoreConfigured();

  if (redisConfig()) {
    const result = await redisCommand<(string | number | null)[]>([
      "EVAL",
      ADD_VOTE_SCRIPT,
      2,
      `votes:voters:${slug}`,
      `votes:${slug}`,
      voterId,
    ]);
    return { votes: Number(result[0]) || 0, voted: Number(result[1]) === 1 };
  }

  const votes = await readDevFile();
  const record = votes[slug] ?? { votes: 0, voters: [] };
  if (!record.voters.includes(voterId)) {
    record.voters.push(voterId);
    record.votes += 1;
    votes[slug] = record;
    await fs.writeFile(DEV_FILE, JSON.stringify(votes, null, 2));
  }
  return { votes: record.votes, voted: true };
}
