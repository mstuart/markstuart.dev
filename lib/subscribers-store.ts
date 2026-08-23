// Email subscriber capture. Stores addresses in the same Upstash Redis used
// by votes and listening history. Sending the actual new-post emails is a
// separate step handled by a mail provider (see /api/subscribe notes); this
// module just owns the list so no signup is ever lost.

const KEY = "subscribers";

function redisConfig() {
  // Vercel's Upstash Marketplace integration provisions KV_REST_API_*; a
  // direct Upstash setup uses UPSTASH_REDIS_REST_*. Accept either.
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function redisCommand(command: string[]): Promise<unknown> {
  const config = redisConfig();
  if (!config) throw new Error("redis not configured");
  const res = await fetch(config.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis error ${res.status}`);
  return ((await res.json()) as { result: unknown }).result;
}

export function isSubscribeConfigured(): boolean {
  return redisConfig() !== null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

/** Add an email to the set. Returns true if newly added, false if already present. */
export async function addSubscriber(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const result = await redisCommand(["SADD", KEY, normalized]);
  return Number(result) === 1;
}

export async function listSubscribers(): Promise<string[]> {
  return (await redisCommand(["SMEMBERS", KEY])) as string[];
}

/** Remove an email from the set. Returns true if it was present. */
export async function removeSubscriber(email: string): Promise<boolean> {
  const result = await redisCommand(["SREM", KEY, email.trim().toLowerCase()]);
  return Number(result) === 1;
}

const NOTIFIED_KEY = "notified_posts";

export async function getNotifiedSlugs(): Promise<string[]> {
  return (await redisCommand(["SMEMBERS", NOTIFIED_KEY])) as string[];
}

export async function markNotified(slug: string): Promise<void> {
  await redisCommand(["SADD", NOTIFIED_KEY, slug]);
}
