import { createHmac } from "node:crypto";

import { redisCommand } from "@/lib/server/redis";

type RateLimitResult = {
  allowed: boolean;
  retryAfter: number;
};

const FIXED_WINDOW_SCRIPT = [
  "local current = redis.call('INCR', KEYS[1])",
  "if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
  "local ttl = redis.call('TTL', KEYS[1])",
  "if ttl < 0 then redis.call('EXPIRE', KEYS[1], ARGV[1]); ttl = tonumber(ARGV[1]) end",
  "return {current, ttl}",
].join("\n");

function identifierDigest(scope: string, identifier: string): string {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret) {
    throw new Error("Rate limiting is not configured");
  }
  return createHmac("sha256", secret).update(`${scope}\0${identifier}`).digest("hex");
}

export async function rateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const digest = identifierDigest(scope, identifier);
  const key = `rate-limit:${scope}:${digest}`;
  const [count, remainingSeconds] = await redisCommand<[number, number]>([
    "EVAL",
    FIXED_WINDOW_SCRIPT,
    1,
    key,
    windowSeconds,
  ]);

  return {
    allowed: count <= limit,
    retryAfter: Math.max(0, remainingSeconds),
  };
}
