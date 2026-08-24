import { afterEach, describe, expect, it, vi } from "vitest";

import { logServerError } from "@/lib/server/log";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logServerError", () => {
  it("never logs an arbitrary Error name", () => {
    const error = new Error("provider body");
    error.name = "reader@example.com?token=secret";
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logServerError({ correlationId: "safe-id", operation: "subscribe", error });

    expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain("reader@example.com");
    expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain("secret");
  });

  it("does not throw for hostile error properties or logger failures", () => {
    const hostile = new Proxy(
      {},
      {
        has() {
          throw new Error("do not expose me");
        },
        getPrototypeOf() {
          throw new Error("do not expose me");
        },
      },
    );
    vi.spyOn(console, "error").mockImplementation(() => {
      throw new Error("logger unavailable");
    });

    expect(() =>
      logServerError({ correlationId: "safe-id", operation: "subscribe", error: hostile }),
    ).not.toThrow();
  });
});
