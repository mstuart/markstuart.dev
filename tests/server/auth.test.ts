import { afterEach, describe, expect, it } from "vitest";

import { requireCron } from "@/lib/server/auth";

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("requireCron", () => {
  it("fails closed when the secret is absent", () => {
    const request = new Request("https://example.test/api/cron");

    expect(requireCron(request)?.status).toBe(401);
  });

  it("accepts only the exact bearer value", () => {
    process.env.CRON_SECRET = "expected-secret";

    expect(
      requireCron(
        new Request("https://example.test/api/cron", {
          headers: { authorization: "Bearer expected-secret" },
        }),
      ),
    ).toBeNull();
    expect(
      requireCron(
        new Request("https://example.test/api/cron", {
          headers: { authorization: "Bearer wrong-secret" },
        }),
      )?.status,
    ).toBe(401);
  });
});
