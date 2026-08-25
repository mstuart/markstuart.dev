import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

import {
  sendConfirmationEmail,
  sendNewPostEmail,
  sendWelcomeEmail,
} from "@/lib/mailer";

const post = {
  slug: "hello-world",
  title: "Hello world",
  date: "2026-08-23",
  description: "A post.",
  minutes: 2,
};

function sentRequest(index = 0): { body: Record<string, unknown>; headers: Headers } {
  const [, init] = fetchMock.mock.calls[index] as [string, RequestInit];
  return {
    body: JSON.parse(String(init.body)) as Record<string, unknown>,
    headers: new Headers(init.headers),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = "resend-test-key";
  process.env.MAIL_IDEMPOTENCY_SECRET = "mail-test-secret";
  delete process.env.SUBSCRIPTION_NOTIFY_TO;
  fetchMock.mockImplementation(async () => Response.json({ id: "email-id" }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("provider idempotency", () => {
  it("sends confirmation mail with a token-digest key", async () => {
    await sendConfirmationEmail("reader@example.com", "confirmation-token");

    const expectedDigest = createHash("sha256").update("confirmation-token").digest("hex");
    const request = sentRequest();
    expect(request.body).toEqual(
      expect.objectContaining({
        to: "reader@example.com",
        text: expect.stringContaining("/subscribe/confirm?token=confirmation-token"),
      }),
    );
    expect(request.headers.get("idempotency-key")).toBe(`confirm/${expectedDigest}`);
  });

  it("uses a stable opaque recipient id across secret rotation with RFC 8058 headers", async () => {
    await sendNewPostEmail(post, "reader@example.com", "unsubscribe-token", "recipient-id");
    process.env.MAIL_IDEMPOTENCY_SECRET = "rotated-mail-secret";
    await sendNewPostEmail(post, "reader@example.com", "unsubscribe-token", "recipient-id");

    const first = sentRequest(0);
    const second = sentRequest(1);
    expect(first.headers.get("idempotency-key")).toBe("post/hello-world/recipient-id");
    expect(second.headers.get("idempotency-key")).toBe("post/hello-world/recipient-id");
    expect(first.body.headers).toEqual({
      "List-Unsubscribe": "<https://markstuart.dev/api/unsubscribe?token=unsubscribe-token>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
    expect(JSON.stringify(first.body)).not.toContain("email=reader%40example.com");
  });

  it("uses the durable welcome job id for retry-safe delivery", async () => {
    await sendWelcomeEmail("reader@example.com", "unsubscribe-token", "welcome-job");

    expect(sentRequest().headers.get("idempotency-key")).toBe("welcome/welcome-job");
    expect(sentRequest().body.bcc).toBeUndefined();
  });

  it("privately copies configured subscription notifications on the durable welcome email", async () => {
    process.env.SUBSCRIPTION_NOTIFY_TO = "owner@example.com";

    await sendWelcomeEmail("reader@example.com", "unsubscribe-token", "welcome-job");

    expect(sentRequest().body).toMatchObject({
      to: "reader@example.com",
      bcc: "owner@example.com",
    });
    expect(sentRequest().headers.get("idempotency-key")).toBe("welcome/welcome-job");
  });

  it("keeps visible mail copy free of em and en dashes", async () => {
    await sendWelcomeEmail("reader@example.com", "unsubscribe-token", "welcome-job");
    await sendNewPostEmail(post, "reader@example.com", "unsubscribe-token", "recipient-id");

    expect(JSON.stringify(sentRequest(0).body)).not.toMatch(/[—–]/u);
    expect(JSON.stringify(sentRequest(1).body)).not.toMatch(/[—–]/u);
  });
});

describe("abortable provider requests", () => {
  it("aborts the live HTTP request when the mail deadline expires", async () => {
    vi.useFakeTimers();
    const providerSignals: AbortSignal[] = [];
    fetchMock.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      const providerSignal = init?.signal as AbortSignal;
      providerSignals.push(providerSignal);
      return new Promise<Response>((_resolve, reject) => {
        providerSignal.addEventListener("abort", () => reject(providerSignal.reason));
      });
    });

    const delivery = sendConfirmationEmail("reader@example.com", "confirmation-token");
    const rejected = expect(delivery).rejects.toBeDefined();
    await vi.advanceTimersByTimeAsync(8_000);

    await rejected;
    expect(providerSignals[0]?.aborted).toBe(true);
  });
});
