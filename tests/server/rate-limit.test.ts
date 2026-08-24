import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { redisCommand } = vi.hoisted(() => ({ redisCommand: vi.fn() }));

vi.mock("@/lib/server/redis", () => ({ redisCommand }));

import { rateLimit } from "@/lib/server/rate-limit";

beforeEach(() => {
  process.env.RATE_LIMIT_SECRET = "test-rate-limit-secret";
  redisCommand.mockReset();
});

afterEach(() => {
  delete process.env.RATE_LIMIT_SECRET;
});

describe("rateLimit", () => {
  it("sets expiry only on the first increment", async () => {
    redisCommand.mockResolvedValueOnce([1, 60]);

    await expect(rateLimit("subscribe", "reader@example.com", 5, 60)).resolves.toEqual({
      allowed: true,
      retryAfter: 60,
    });

    expect(redisCommand).toHaveBeenCalledWith([
      "EVAL",
      expect.stringContaining("redis.call('EXPIRE'"),
      1,
      expect.stringMatching(/^rate-limit:subscribe:[a-f0-9]{64}$/),
      60,
    ]);
    expect(redisCommand).toHaveBeenCalledTimes(1);
  });

  it("does not send a raw identifier to Redis", async () => {
    redisCommand.mockResolvedValueOnce([2, 42]);

    await rateLimit("subscribe", "reader@example.com", 5, 60);

    const expectedDigest = createHmac("sha256", "test-rate-limit-secret")
      .update("subscribe\0reader@example.com")
      .digest("hex");
    const serializedCommands = JSON.stringify(redisCommand.mock.calls);
    expect(serializedCommands).not.toContain("reader@example.com");
    expect(redisCommand).toHaveBeenCalledWith([
      "EVAL",
      expect.any(String),
      1,
      `rate-limit:subscribe:${expectedDigest}`,
      60,
    ]);
    expect(redisCommand).toHaveBeenCalledTimes(1);
  });

  it("returns the remaining window for a denied request", async () => {
    redisCommand.mockResolvedValueOnce([6, 12]);

    await expect(rateLimit("subscribe", "reader@example.com", 5, 60)).resolves.toEqual({
      allowed: false,
      retryAfter: 12,
    });
  });
});
