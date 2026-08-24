import { beforeEach, describe, expect, it, vi } from "vitest";

const redisCommand = vi.hoisted(() => vi.fn());
const store = vi.hoisted(() => ({
  createPendingSubscriber: vi.fn(),
  isConfirmedSubscriber: vi.fn(),
  isSubscribeConfigured: vi.fn(),
  isValidEmail: vi.fn(),
  normalizeEmail: vi.fn((email: string) => email.trim().toLowerCase()),
  queueConfirmationDelivery: vi.fn(),
}));

vi.mock("@/lib/server/redis", () => ({ redisCommand }));
vi.mock("@/lib/subscribers-store", () => store);
vi.mock("@/lib/mailer", () => ({ sendConfirmationEmail: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));

import { POST } from "@/app/api/subscribe/route";

beforeEach(() => {
  process.env.RATE_LIMIT_SECRET = "rate-limit-test-secret";
  redisCommand.mockReset();
  redisCommand.mockResolvedValue([1, 3600]);
  store.isSubscribeConfigured.mockReturnValue(true);
  store.isValidEmail.mockReturnValue(true);
  store.isConfirmedSubscriber.mockResolvedValue(true);
  store.queueConfirmationDelivery.mockResolvedValue(null);
});

describe("subscribe client privacy", () => {
  it("stores only keyed hashes for both email and client rate limits", async () => {
    const response = await POST(
      new Request("https://markstuart.dev/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" },
        body: JSON.stringify({ email: "reader@example.com" }),
      }),
    );

    expect(response.status).toBe(202);
    expect(redisCommand).toHaveBeenCalledTimes(2);
    for (const [command] of redisCommand.mock.calls) {
      expect(command[3]).toMatch(/^rate-limit:subscribe-(email|client):[a-f0-9]{64}$/);
    }
    const serialized = JSON.stringify(redisCommand.mock.calls);
    expect(serialized).not.toContain("reader@example.com");
    expect(serialized).not.toContain("203.0.113.9");
  });
});
