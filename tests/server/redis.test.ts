import { afterEach, describe, expect, it, vi } from "vitest";

import { redisConfig, redisPipeline } from "@/lib/server/redis";

const REDIS_ENV_KEYS = [
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

afterEach(() => {
  for (const key of REDIS_ENV_KEYS) {
    delete process.env[key];
  }
  vi.unstubAllGlobals();
});

describe("redisPipeline", () => {
  it("rejects a response whose result count does not match the commands", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json([{ result: 1 }]),
      ),
    );

    await expect(
      redisPipeline<number>([
        ["INCR", "one"],
        ["INCR", "two"],
      ]),
    ).rejects.toThrow("Redis pipeline failed");
  });

  it("accepts a null command result", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json([{ result: null }])),
    );

    await expect(redisPipeline<null>([["GET", "missing"]])).resolves.toEqual([null]);
  });

  it("rejects malformed and per-command error entries", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";

    for (const payload of [[null], [{ error: "provider detail" }]]) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(Response.json(payload)),
      );
      await expect(redisPipeline([["GET", "key"]])).rejects.toThrow(
        "Redis pipeline failed",
      );
    }
  });
});

describe("redisConfig", () => {
  it("never combines a partial KV pair with Upstash", () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "upstash-token";

    expect(redisConfig()).toBeNull();
  });

  it("prefers a complete KV pair", () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "upstash-token";

    expect(redisConfig()).toEqual({
      url: "https://kv.example",
      token: "kv-token",
    });
  });
});
