import { Buffer } from "node:buffer";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const verify = vi.hoisted(() => vi.fn());
const fetchMock = vi.fn();
const store = vi.hoisted(() => ({
  beginDeliveryAttempt: vi.fn(),
  isInboundComplete: vi.fn(),
  markInboundComplete: vi.fn(),
}));

vi.mock("svix", () => ({
  Webhook: class {
    verify = verify;
  },
}));
vi.mock("@/lib/subscribers-store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/subscribers-store")>()),
  ...store,
}));

import { POST } from "@/app/api/email/inbound/route";

const RAW_EMAIL = [
  "From: Sender <sender@example.com>",
  "To: mark@markstuart.dev",
  "Subject: Original subject",
  "MIME-Version: 1.0",
  'Content-Type: multipart/mixed; boundary="mail-boundary"',
  "",
  "--mail-boundary",
  'Content-Type: text/plain; charset="utf-8"',
  "",
  "Original body",
  "--mail-boundary",
  'Content-Type: text/plain; name="note.txt"',
  'Content-Disposition: attachment; filename="note.txt"',
  "Content-Transfer-Encoding: base64",
  "",
  "YXR0YWNobWVudA==",
  "--mail-boundary--",
  "",
].join("\r\n");

function rawEmailWithAttachments(
  attachmentSizes: number[],
  body = "Small body",
): string {
  const parts = [
    "From: Sender <sender@example.com>",
    "To: mark@markstuart.dev",
    "Subject: Aggregate attachment size",
    "MIME-Version: 1.0",
    'Content-Type: multipart/mixed; boundary="size-boundary"',
    "",
    "--size-boundary",
    'Content-Type: text/plain; charset="utf-8"',
    "",
    body,
  ];

  attachmentSizes.forEach((size, index) => {
    parts.push(
      "--size-boundary",
      `Content-Type: application/octet-stream; name="part-${index}.bin"`,
      `Content-Disposition: attachment; filename="part-${index}.bin"`,
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.alloc(size, index + 1).toString("base64"),
    );
  });
  parts.push("--size-boundary--", "");
  return parts.join("\r\n");
}

function successfulFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(input);
  if (url.endsWith("/emails/receiving/inbound-email-id")) {
    return Promise.resolve(
      Response.json({
        subject: "Original subject",
        raw: { download_url: "https://storage.example.com/raw-message" },
      }),
    );
  }
  if (url === "https://storage.example.com/raw-message") {
    return Promise.resolve(new Response(RAW_EMAIL));
  }
  if (url === "https://api.resend.com/emails" && init?.method === "POST") {
    return Promise.resolve(Response.json({ id: "forward-id" }));
  }
  throw new Error("unexpected fetch");
}

function request(
  eventId = "msg_verified_123",
  recipients = ["mark@markstuart.dev"],
) {
  return new Request("https://markstuart.dev/api/email/inbound", {
    method: "POST",
    headers: {
      "svix-id": eventId,
      "svix-timestamp": "1724400000",
      "svix-signature": "v1,signature",
    },
    body: JSON.stringify({
      type: "email.received",
      data: { email_id: "inbound-email-id", to: recipients },
    }),
  });
}

function oversizedWebhookRequest() {
  return new Request("https://markstuart.dev/api/email/inbound", {
    method: "POST",
    headers: {
      "svix-id": "msg_oversized",
      "svix-timestamp": "1724400000",
      "svix-signature": "v1,signature",
    },
    body: "x".repeat(64 * 1024 + 1),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_WEBHOOK_SECRET = "whsec_test";
  process.env.RESEND_API_KEY = "resend-test-key";
  process.env.INBOUND_FORWARD_TO = "owner@example.com";
  verify.mockImplementation((payload: string) => JSON.parse(payload));
  store.isInboundComplete.mockResolvedValue(false);
  store.beginDeliveryAttempt.mockResolvedValue("ready");
  store.markInboundComplete.mockResolvedValue(undefined);
  fetchMock.mockImplementation(successfulFetch);
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  delete process.env.INBOUND_FORWARD_TO;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("inbound deduplication", () => {
  it("rejects an oversized webhook body before signature verification or provider work", async () => {
    const response = await POST(oversizedWebhookRequest());

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "payload_too_large" },
    });
    expect(verify).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the verified Svix message id for forwarding idempotency and completion", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [metadataUrl, metadataInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const [rawUrl, rawInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const [sendUrl, sendInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(metadataUrl).toBe(
      "https://api.resend.com/emails/receiving/inbound-email-id",
    );
    expect(String(rawUrl)).toBe("https://storage.example.com/raw-message");
    expect(sendUrl).toBe("https://api.resend.com/emails");
    expect(metadataInit.signal).toBe(rawInit.signal);
    expect(rawInit.signal).toBe(sendInit.signal);
    expect(new Headers(sendInit.headers).get("idempotency-key")).toBe(
      "inbound/msg_verified_123",
    );
    expect(JSON.parse(String(sendInit.body))).toMatchObject({
      to: "owner@example.com",
      reply_to: "sender@example.com",
      subject: "Original subject",
      text: expect.stringContaining("Original body"),
      attachments: [
        expect.objectContaining({
          filename: "note.txt",
          content: "YXR0YWNobWVudA==",
          content_type: "text/plain",
        }),
      ],
    });
    expect(store.markInboundComplete).toHaveBeenCalledWith("msg_verified_123");
  });

  it("uses the original reply-to address when forwarding", async () => {
    const rawEmail = RAW_EMAIL.replace(
      "From: Sender <sender@example.com>",
      "From: Sender <sender@example.com>\r\nReply-To: Human <reply@example.com>",
    );
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === "https://storage.example.com/raw-message") {
        return Promise.resolve(new Response(rawEmail));
      }
      return successfulFetch(input, init);
    });

    const response = await POST(request("msg_reply_to"));

    expect(response.status).toBe(200);
    const [, , [, sendInit]] = fetchMock.mock.calls as [string, RequestInit][];
    expect(JSON.parse(String(sendInit.body))).toMatchObject({
      reply_to: "reply@example.com",
    });
  });

  it("falls back to the validated sender when reply-to is invalid", async () => {
    const rawEmail = RAW_EMAIL.replace(
      "From: Sender <sender@example.com>",
      "From: Sender <sender@example.com>\r\nReply-To: reply@localhost",
    );
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === "https://storage.example.com/raw-message") {
        return Promise.resolve(new Response(rawEmail));
      }
      return successfulFetch(input, init);
    });

    const response = await POST(request("msg_invalid_reply_to"));

    expect(response.status).toBe(200);
    const [, , [, sendInit]] = fetchMock.mock.calls as [string, RequestInit][];
    expect(JSON.parse(String(sendInit.body))).toMatchObject({
      reply_to: "sender@example.com",
    });
  });

  it("does not forward a completed Svix event again", async () => {
    store.isInboundComplete.mockResolvedValue(true);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.markInboundComplete).not.toHaveBeenCalled();
  });

  it("ignores verified events for unpublished recipients", async () => {
    const response = await POST(request("msg_other_recipient", ["other@markstuart.dev"]));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ignored: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.beginDeliveryAttempt).not.toHaveBeenCalled();
    expect(store.markInboundComplete).not.toHaveBeenCalled();
  });

  it("records completion only after forwarding succeeds", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === "https://api.resend.com/emails" && init?.method === "POST") {
        return Promise.resolve(new Response(null, { status: 503 }));
      }
      return successfulFetch(input, init);
    });

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(store.markInboundComplete).not.toHaveBeenCalled();
  });

  it("rejects an oversized raw message before parsing or forwarding it", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === "https://storage.example.com/raw-message") {
        return Promise.resolve(new Response(new Uint8Array(12 * 1024 * 1024 + 1)));
      }
      return successfulFetch(input, init);
    });

    const response = await POST(request());

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "payload_too_large" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(store.markInboundComplete).not.toHaveBeenCalled();
  });

  it("rejects a message whose aggregate decoded body and attachment size exceeds the limit", async () => {
    const rawEmail = rawEmailWithAttachments(
      [4 * 1024 * 1024 - 1024, 4 * 1024 * 1024 - 1024],
      "x".repeat(4096),
    );
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === "https://storage.example.com/raw-message") {
        return Promise.resolve(new Response(rawEmail));
      }
      return successfulFetch(input, init);
    });

    const response = await POST(request());

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "payload_too_large" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(store.markInboundComplete).not.toHaveBeenCalled();
  });

  it("fails generically when the private forwarding destination is not configured", async () => {
    delete process.env.INBOUND_FORWARD_TO;

    const response = await POST(request());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "not_configured" } });
    expect(verify).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed after the provider idempotency window for an ambiguous attempt", async () => {
    store.beginDeliveryAttempt.mockResolvedValue("ambiguous");

    const response = await POST(request());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "forward_failed" } });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.markInboundComplete).not.toHaveBeenCalled();
  });

  it("aborts a hanging metadata request at the end-to-end deadline", async () => {
    vi.useFakeTimers();
    const providerSignals: AbortSignal[] = [];
    fetchMock.mockImplementationOnce((_input, init) => {
      const providerSignal = init?.signal as AbortSignal;
      providerSignals.push(providerSignal);
      return new Promise<Response>((_resolve, reject) => {
        providerSignal.addEventListener("abort", () => reject(providerSignal.reason));
      });
    });

    const forwarding = POST(request());
    await vi.advanceTimersByTimeAsync(8_000);
    const response = await forwarding;

    expect(response.status).toBe(502);
    expect(providerSignals[0]?.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.markInboundComplete).not.toHaveBeenCalled();
  });

  it("aborts a hanging raw-message request on the same deadline", async () => {
    vi.useFakeTimers();
    const providerSignals: AbortSignal[] = [];
    fetchMock
      .mockImplementationOnce((input, init) => {
        providerSignals.push(init?.signal as AbortSignal);
        return successfulFetch(input, init);
      })
      .mockImplementationOnce((_input, init) => {
        const providerSignal = init?.signal as AbortSignal;
        providerSignals.push(providerSignal);
        return new Promise<Response>((_resolve, reject) => {
          providerSignal.addEventListener("abort", () => reject(providerSignal.reason));
        });
      });

    const forwarding = POST(request());
    await vi.advanceTimersByTimeAsync(8_000);
    const response = await forwarding;

    expect(response.status).toBe(502);
    expect(providerSignals).toHaveLength(2);
    expect(providerSignals[0]).toBe(providerSignals[1]);
    expect(providerSignals[1]?.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(store.markInboundComplete).not.toHaveBeenCalled();
  });
});
