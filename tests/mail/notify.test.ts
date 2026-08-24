import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  acquireNotificationLock: vi.fn(),
  beginDeliveryAttempt: vi.fn(),
  createNotificationRecipientScan: vi.fn(),
  getNotifiedSlugs: vi.fn(),
  getOrCreateUnsubscribeToken: vi.fn(),
  isSubscribeConfigured: vi.fn(),
  listPendingNotificationRecipients: vi.fn(),
  markDeliveryComplete: vi.fn(),
  markNotified: vi.fn(),
  recipientDigest: vi.fn((email: string) => `digest-${email}`),
  releaseNotificationRecipientScan: vi.fn(),
  releaseNotificationLock: vi.fn(),
  renewNotificationLock: vi.fn(),
}));
const sendNewPostEmail = vi.hoisted(() => vi.fn());
const processQueuedLifecycleMailJobs = vi.hoisted(() => vi.fn());
const getAllPosts = vi.hoisted(() => vi.fn());

vi.mock("@/lib/subscribers-store", () => store);
vi.mock("@/lib/mailer", () => ({ processQueuedLifecycleMailJobs, sendNewPostEmail }));
vi.mock("@/lib/posts", () => ({ getAllPosts }));

import { GET } from "@/app/api/notify/route";

const post = {
  slug: "hello-world",
  title: "Hello world",
  date: "2026-08-23",
  description: "A post.",
  minutes: 2,
};

function request() {
  return new Request("https://markstuart.dev/api/notify", {
    headers: { authorization: "Bearer cron-test-secret" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "cron-test-secret";
  store.isSubscribeConfigured.mockReturnValue(true);
  store.getNotifiedSlugs.mockResolvedValue([]);
  store.acquireNotificationLock.mockResolvedValue("lock-token");
  store.beginDeliveryAttempt.mockResolvedValue("ready");
  store.createNotificationRecipientScan.mockImplementation(() => ({}));
  store.listPendingNotificationRecipients.mockResolvedValue({
    recipients: [],
    work: 1,
    exhausted: true,
  });
  store.releaseNotificationLock.mockResolvedValue(undefined);
  store.getOrCreateUnsubscribeToken.mockResolvedValue("unsubscribe-token");
  store.markDeliveryComplete.mockResolvedValue(undefined);
  store.markNotified.mockResolvedValue(undefined);
  store.releaseNotificationRecipientScan.mockResolvedValue(undefined);
  store.renewNotificationLock.mockResolvedValue(true);
  getAllPosts.mockReturnValue([post]);
  sendNewPostEmail.mockResolvedValue(undefined);
  processQueuedLifecycleMailJobs.mockResolvedValue({ completed: 0, failed: 0 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("notification retry behavior", () => {
  it("returns a monitorable terminal failure when a lifecycle job remains retryable", async () => {
    getAllPosts.mockReturnValue([]);
    processQueuedLifecycleMailJobs.mockResolvedValue({ completed: 2, failed: 1 });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: {
        code: "notification_delivery_failed",
        correlationId: expect.any(String),
      },
      configured: true,
      newPosts: 0,
      announced: [],
      sent: 0,
      failed: 0,
      counters: {
        lifecycleCompleted: 2,
        lifecycleFailed: 1,
        recipientSent: 0,
        recipientFailed: 0,
        postsAnnounced: 0,
      },
    });
    const logged = consoleSpy.mock.calls.map((call) => call[1]);
    expect(logged).toEqual([
      expect.objectContaining({
        correlationId: body.error.correlationId,
        code: "notification_lifecycle_delivery_failed",
        counters: { lifecycleCompleted: 2, lifecycleFailed: 1 },
      }),
      expect.objectContaining({
        correlationId: body.error.correlationId,
        code: "notification_delivery_failed",
        counters: body.counters,
      }),
    ]);
  });

  it("skips recipients already completed on a retry", async () => {
    store.listPendingNotificationRecipients
      .mockResolvedValueOnce({
        recipients: [{ email: "new@example.com", recipientId: "recipient-new@example.com" }],
        work: 4,
        exhausted: true,
      })
      .mockResolvedValueOnce({ recipients: [], work: 4, exhausted: true });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(sendNewPostEmail).toHaveBeenCalledTimes(1);
    expect(sendNewPostEmail).toHaveBeenCalledWith(
      post,
      "new@example.com",
      "unsubscribe-token",
      "recipient-new@example.com",
    );
    expect(store.markDeliveryComplete).toHaveBeenCalledWith(
      "hello-world",
      "recipient-new@example.com",
    );
    expect(store.markNotified).toHaveBeenCalledWith("hello-world");
  });

  it("bounds recipient sends to concurrency two", async () => {
    const recipients = ["one@example.com", "two@example.com", "three@example.com", "four@example.com"];
    store.listPendingNotificationRecipients
      .mockResolvedValueOnce({
        recipients: recipients.map((email) => ({ email, recipientId: `recipient-${email}` })),
        work: 16,
        exhausted: true,
      })
      .mockResolvedValueOnce({ recipients: [], work: 4, exhausted: true });

    let active = 0;
    let peak = 0;
    sendNewPostEmail.mockImplementation(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
    });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(peak).toBe(2);
    expect(sendNewPostEmail).toHaveBeenCalledTimes(4);
    expect(store.renewNotificationLock.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it("records a recipient failure without erasing completed recipients", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    store.listPendingNotificationRecipients
      .mockResolvedValueOnce({
        recipients: [
          { email: "ok@example.com", recipientId: "recipient-ok@example.com" },
          { email: "fail@example.com", recipientId: "recipient-fail@example.com" },
        ],
        work: 8,
        exhausted: true,
      })
      .mockResolvedValueOnce({
        recipients: [{ email: "fail@example.com", recipientId: "recipient-fail@example.com" }],
        work: 4,
        exhausted: false,
      });
    sendNewPostEmail.mockImplementation(async (_post, email) => {
      if (email === "fail@example.com") throw new Error("provider details");
    });

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual(
      expect.objectContaining({
        error: {
          code: "notification_delivery_failed",
          correlationId: expect.any(String),
        },
        sent: 1,
        failed: 1,
        announced: [],
        counters: expect.objectContaining({ recipientSent: 1, recipientFailed: 1 }),
      }),
    );
    expect(store.markDeliveryComplete).toHaveBeenCalledTimes(1);
    expect(store.markNotified).not.toHaveBeenCalled();
    expect(store.releaseNotificationLock).toHaveBeenCalledWith("hello-world", "lock-token");
    expect(consoleSpy.mock.calls.map((call) => call[1])).toEqual([
      expect.objectContaining({
        correlationId: body.error.correlationId,
        code: "notification_recipient_delivery_failed",
      }),
      expect.objectContaining({
        correlationId: body.error.correlationId,
        code: "notification_delivery_failed",
        counters: body.counters,
      }),
    ]);
  });

  it("rejects a concurrent run when the post lock is held", async () => {
    store.acquireNotificationLock.mockResolvedValue(null);

    const response = await GET(request());

    expect(response.status).toBe(409);
    expect(sendNewPostEmail).not.toHaveBeenCalled();
    expect(store.releaseNotificationLock).not.toHaveBeenCalled();
  });

  it("fails closed without resending when a durable attempt is older than the provider window", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    store.listPendingNotificationRecipients
      .mockResolvedValueOnce({
        recipients: [{ email: "reader@example.com", recipientId: "recipient-reader@example.com" }],
        work: 4,
        exhausted: true,
      })
      .mockResolvedValueOnce({
        recipients: [{ email: "reader@example.com", recipientId: "recipient-reader@example.com" }],
        work: 4,
        exhausted: false,
      });
    store.beginDeliveryAttempt.mockResolvedValue("ambiguous");

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual(
      expect.objectContaining({
        error: {
          code: "notification_delivery_failed",
          correlationId: expect.any(String),
        },
        sent: 0,
        failed: 1,
        announced: [],
      }),
    );
    expect(sendNewPostEmail).not.toHaveBeenCalled();
    expect(store.markDeliveryComplete).not.toHaveBeenCalled();
  });
});
