import { promises as fs } from "fs";
import path from "path";

// Vote storage. In production, set UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN (Vercel marketplace Redis) and votes persist in
// Redis via its REST API, no SDK required. Without them (local dev), votes
// live in a gitignored .votes.json file.

const DEV_FILE = path.join(process.cwd(), ".votes.json");

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function redisCommand(command: string[]): Promise<unknown> {
  const config = redisConfig();
  if (!config) throw new Error("redis not configured");
  const res = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis error ${res.status}`);
  const data = (await res.json()) as { result: unknown };
  return data.result;
}

async function readDevFile(): Promise<Record<string, number>> {
  try {
    return JSON.parse(await fs.readFile(DEV_FILE, "utf8")) as Record<string, number>;
  } catch {
    return {};
  }
}

export async function getVotes(slug: string): Promise<number> {
  if (redisConfig()) {
    const result = await redisCommand(["GET", `votes:${slug}`]);
    return result ? Number(result) : 0;
  }
  const votes = await readDevFile();
  return votes[slug] ?? 0;
}

export async function addVote(slug: string): Promise<number> {
  if (redisConfig()) {
    const result = await redisCommand(["INCR", `votes:${slug}`]);
    return Number(result);
  }
  const votes = await readDevFile();
  votes[slug] = (votes[slug] ?? 0) + 1;
  await fs.writeFile(DEV_FILE, JSON.stringify(votes, null, 2));
  return votes[slug];
}
