// Email subscriber capture. Stores addresses in the same Upstash Redis used
// by votes and listening history. Sending the actual new-post emails is a
// separate step handled by a mail provider (see /api/subscribe notes); this
// module just owns the list so no signup is ever lost.

const KEY = "subscribers";

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
