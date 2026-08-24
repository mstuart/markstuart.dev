import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  getSubscriptionReadiness: vi.fn(),
  isSubscribeConfigured: vi.fn(),
  isUnsubscribeTokenValid: vi.fn(),
  isValidEmail: vi.fn(),
  normalizeEmail: vi.fn((email: string) => email.trim().toLowerCase()),
  queueConfirmationDelivery: vi.fn(),
  unsubscribeSubscriber: vi.fn(),
}));
const rateLimit = vi.hoisted(() => vi.fn());
const processLifecycleMailJob = vi.hoisted(() => vi.fn());
const afterCallbacks = vi.hoisted(() => [] as Array<() => Promise<void>>);
const after = vi.hoisted(() => vi.fn((callback: () => Promise<void>) => {
  afterCallbacks.push(callback);
}));

vi.mock("@/lib/subscribers-store", () => store);
vi.mock("@/lib/server/rate-limit", () => ({ rateLimit }));
vi.mock("@/lib/mailer", () => ({ processLifecycleMailJob }));
vi.mock("next/server", () => ({ after }));

import { POST as subscribe } from "@/app/api/subscribe/route";
import { GET as unsubscribeGet, POST as unsubscribePost } from "@/app/api/unsubscribe/route";

beforeEach(() => {
  vi.clearAllMocks();
  store.getSubscriptionReadiness.mockReturnValue({ ready: true });
  store.isSubscribeConfigured.mockReturnValue(true);
  store.isValidEmail.mockReturnValue(true);
  store.queueConfirmationDelivery.mockResolvedValue("confirmation-job");
  store.isUnsubscribeTokenValid.mockResolvedValue(true);
  store.unsubscribeSubscriber.mockResolvedValue({ status: "unsubscribed" });
  rateLimit.mockResolvedValue({ allowed: true, retryAfter: 3600 });
  processLifecycleMailJob.mockResolvedValue(undefined);
  afterCallbacks.length = 0;
});

describe("subscribe route", () => {
  it("accepts valid signups without provider work when signup capability is unavailable", async () => {
    store.getSubscriptionReadiness.mockReturnValue({
      ready: false,
      missing: ["resend_api_key"],
    });

    const response = await subscribe(
      new Request("https://markstuart.dev/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "reader@example.com" }),
      }),
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ok: true, status: "check_email" });
    expect(rateLimit).not.toHaveBeenCalled();
    expect(store.queueConfirmationDelivery).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });

  it("returns the same accepted response for pending, existing, limited, and failed signups", async () => {
    const request = () =>
      new Request("https://markstuart.dev/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" },
        body: JSON.stringify({ email: " Reader@Example.com " }),
      });

    const accepted = { ok: true, status: "check_email" };
    await expect((await subscribe(request())).json()).resolves.toEqual(accepted);

    store.queueConfirmationDelivery.mockResolvedValueOnce(null);
    await expect((await subscribe(request())).json()).resolves.toEqual(accepted);

    rateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 12 });
    await expect((await subscribe(request())).json()).resolves.toEqual(accepted);

    rateLimit.mockRejectedValueOnce(new Error("provider details"));
    await expect((await subscribe(request())).json()).resolves.toEqual(accepted);

    expect((await subscribe(request())).status).toBe(202);
  });

  it("applies separate per-email and per-client hourly limits", async () => {
    const response = await subscribe(
      new Request("https://markstuart.dev/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
        body: JSON.stringify({ email: " Reader@Example.com " }),
      }),
    );

    expect(response.status).toBe(202);
    expect(rateLimit).toHaveBeenNthCalledWith(1, "subscribe-email", "reader@example.com", 3, 3600);
    expect(rateLimit).toHaveBeenNthCalledWith(2, "subscribe-client", "203.0.113.9", 10, 3600);
  });

  it("queues confirmation delivery and returns before provider work for every membership outcome", async () => {
    const request = () =>
      new Request("https://markstuart.dev/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" },
        body: JSON.stringify({ email: "reader@example.com" }),
      });

    const pendingResponse = await subscribe(request());

    expect(pendingResponse.status).toBe(202);
    expect(store.queueConfirmationDelivery).toHaveBeenCalledWith("reader@example.com", true);
    expect(processLifecycleMailJob).not.toHaveBeenCalled();
    expect(afterCallbacks).toHaveLength(1);

    store.queueConfirmationDelivery.mockResolvedValueOnce(null);
    const existingResponse = await subscribe(request());

    expect(existingResponse.status).toBe(202);
    expect(store.queueConfirmationDelivery).toHaveBeenCalledTimes(2);
    expect(processLifecycleMailJob).not.toHaveBeenCalled();
    expect(afterCallbacks).toHaveLength(2);

    rateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 12 });
    const limitedResponse = await subscribe(request());

    expect(limitedResponse.status).toBe(202);
    expect(store.queueConfirmationDelivery).toHaveBeenLastCalledWith("reader@example.com", false);
    expect(afterCallbacks).toHaveLength(3);
  });
});

describe("unsubscribe route", () => {
  it("GET renders a human confirmation form without unsubscribing", async () => {
    const response = await unsubscribeGet(
      new Request("https://markstuart.dev/api/unsubscribe?token=opaque-token"),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<form method="post"');
    expect(html).toContain('name="token"');
    expect(store.unsubscribeSubscriber).not.toHaveBeenCalled();
  });

  it("a human form POST deliberately unsubscribes", async () => {
    const response = await unsubscribePost(
      new Request("https://markstuart.dev/api/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "token=opaque-token",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("unsubscribed");
    expect(store.unsubscribeSubscriber).toHaveBeenCalledWith("opaque-token");
  });

  it("an RFC 8058 POST unsubscribes immediately and returns an empty 200", async () => {
    const response = await unsubscribePost(
      new Request("https://markstuart.dev/api/unsubscribe?token=opaque-token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "List-Unsubscribe=One-Click",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
    expect(store.unsubscribeSubscriber).toHaveBeenCalledWith("opaque-token");
  });
});
