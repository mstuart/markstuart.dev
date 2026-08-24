import { createHash } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  beginDeliveryAttempt: vi.fn(),
  completeLifecycleMailJob: vi.fn(),
  createLifecycleMailScan: vi.fn(),
  getLifecycleMailJob: vi.fn(),
  getOrCreateUnsubscribeToken: vi.fn(),
  listLifecycleMailJobs: vi.fn(),
  quarantineLifecycleMailJob: vi.fn(),
  recipientDigest: vi.fn(),
}));

vi.mock("@/lib/subscribers-store", () => store);

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = "resend-test-key";
  store.beginDeliveryAttempt.mockResolvedValue("ready");
  store.completeLifecycleMailJob.mockResolvedValue(undefined);
  store.createLifecycleMailScan.mockReturnValue({});
  store.getLifecycleMailJob.mockResolvedValue({
    id: "welcome-job",
    kind: "welcome",
    email: "reader@example.com",
  });
  store.getOrCreateUnsubscribeToken.mockResolvedValue("unsubscribe-token");
  store.listLifecycleMailJobs.mockResolvedValue({ jobs: [], work: 0, exhausted: true });
  store.quarantineLifecycleMailJob.mockResolvedValue(undefined);
  fetchMock.mockResolvedValue(Response.json({ id: "email-id" }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("durable lifecycle mail jobs", () => {
  it("keeps a failed welcome job retryable and completes it only after provider success", async () => {
    const mailer = await import("@/lib/mailer");
    const processLifecycleMailJob = Reflect.get(mailer, "processLifecycleMailJob") as
      | ((kind: "welcome", id: string) => Promise<void>)
      | undefined;
    expect(processLifecycleMailJob).toEqual(expect.any(Function));
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));

    await expect(processLifecycleMailJob?.("welcome", "welcome-job")).rejects.toThrow();
    expect(store.completeLifecycleMailJob).not.toHaveBeenCalled();

    await expect(processLifecycleMailJob?.("welcome", "welcome-job")).resolves.toBeUndefined();
    expect(store.completeLifecycleMailJob).toHaveBeenCalledWith(
      "welcome",
      "welcome-job",
      "welcome-job",
    );
    const idempotencyKeys = fetchMock.mock.calls.map(([, init]) =>
      new Headers(init?.headers).get("idempotency-key"),
    );
    expect(idempotencyKeys).toEqual([
      "welcome/welcome-job",
      "welcome/welcome-job",
      "welcome/welcome-job",
      "welcome/welcome-job",
    ]);
  });

  it("does not call the provider for a lifecycle job whose send is ambiguous", async () => {
    const mailer = await import("@/lib/mailer");
    const processLifecycleMailJob = Reflect.get(mailer, "processLifecycleMailJob") as
      | ((kind: "welcome", id: string) => Promise<void>)
      | undefined;
    expect(processLifecycleMailJob).toEqual(expect.any(Function));
    store.beginDeliveryAttempt.mockResolvedValue("ambiguous");

    await expect(processLifecycleMailJob?.("welcome", "welcome-job")).rejects.toThrow();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.completeLifecycleMailJob).not.toHaveBeenCalled();
  });

  it("uses a new durable attempt when an address starts a later confirmation cycle", async () => {
    const mailer = await import("@/lib/mailer");
    const processLifecycleMailJob = Reflect.get(mailer, "processLifecycleMailJob") as
      | ((kind: "confirmation", id: string) => Promise<void>)
      | undefined;
    expect(processLifecycleMailJob).toEqual(expect.any(Function));
    store.getLifecycleMailJob
      .mockResolvedValueOnce({
        id: "address-job",
        kind: "confirmation",
        email: "reader@example.com",
        token: "first-token",
      })
      .mockResolvedValueOnce({
        id: "address-job",
        kind: "confirmation",
        email: "reader@example.com",
        token: "second-token",
      });

    await processLifecycleMailJob?.("confirmation", "address-job");
    await processLifecycleMailJob?.("confirmation", "address-job");

    const digest = (token: string) => createHash("sha256").update(token).digest("hex");
    expect(store.beginDeliveryAttempt).toHaveBeenNthCalledWith(
      1,
      `lifecycle:confirmation:${digest("first-token")}`,
    );
    expect(store.beginDeliveryAttempt).toHaveBeenNthCalledWith(
      2,
      `lifecycle:confirmation:${digest("second-token")}`,
    );
  });

  it("retries a transient lifecycle failure inside the provider key window", async () => {
    const { processLifecycleMailJob } = await import("@/lib/mailer");
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ id: "email-id" }));

    await expect(processLifecycleMailJob("welcome", "welcome-job")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(store.completeLifecycleMailJob).toHaveBeenCalledTimes(1);
    expect(
      fetchMock.mock.calls.map(([, init]) =>
        new Headers(init?.headers).get("idempotency-key"),
      ),
    ).toEqual(["welcome/welcome-job", "welcome/welcome-job", "welcome/welcome-job"]);
  });

  it("quarantines terminal ambiguous jobs and scans through them to a healthy job", async () => {
    const { processQueuedLifecycleMailJobs } = await import("@/lib/mailer");
    const jobs = ["old-1", "old-2", "old-3", "old-4", "healthy"].map((id) => ({
      id,
      kind: "welcome" as const,
      email: `${id}@example.com`,
    }));
    const remaining = [...jobs];
    store.listLifecycleMailJobs.mockImplementation(async (_scan, limit: number) => {
      const page = remaining.splice(0, limit);
      return { jobs: page, work: page.length, exhausted: remaining.length === 0 };
    });
    store.getLifecycleMailJob.mockImplementation(async (_kind, id) =>
      jobs.find((job) => job.id === id),
    );
    store.beginDeliveryAttempt.mockImplementation(async (deliveryId: string) =>
      deliveryId.endsWith(":healthy") ? "ready" : "ambiguous",
    );

    await expect(processQueuedLifecycleMailJobs(1)).resolves.toEqual({
      completed: 1,
      failed: 4,
    });

    expect(store.quarantineLifecycleMailJob).toHaveBeenCalledTimes(4);
    expect(store.completeLifecycleMailJob).toHaveBeenCalledWith(
      "welcome",
      "healthy",
      "healthy",
    );
  });

  it("quarantines an exhausted job at the next daily drain without resending", async () => {
    const { processQueuedLifecycleMailJobs } = await import("@/lib/mailer");
    const job = {
      id: "welcome-job",
      kind: "welcome" as const,
      email: "reader@example.com",
    };
    store.listLifecycleMailJobs.mockResolvedValue({ jobs: [job], work: 1, exhausted: true });
    store.getLifecycleMailJob.mockResolvedValue(job);
    store.beginDeliveryAttempt
      .mockResolvedValueOnce("ready")
      .mockResolvedValueOnce("ambiguous");
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

    await expect(processQueuedLifecycleMailJobs(1)).resolves.toEqual({
      completed: 0,
      failed: 1,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await expect(processQueuedLifecycleMailJobs(1)).resolves.toEqual({
      completed: 0,
      failed: 1,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(store.quarantineLifecycleMailJob).toHaveBeenCalledWith(
      "welcome",
      "welcome-job",
    );
  });
});
