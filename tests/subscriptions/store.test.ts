import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { redisCommand, redisPipeline } = vi.hoisted(() => ({
  redisCommand: vi.fn(),
  redisPipeline: vi.fn(),
}));

vi.mock("@/lib/server/redis", () => ({ redisCommand, redisPipeline }));

import {
  acquireNotificationLock,
  confirmSubscriber,
  createLifecycleMailScan,
  createNotificationRecipientScan,
  createPendingSubscriber,
  isConfirmationTokenValid,
  listLifecycleMailJobs,
  listPendingNotificationRecipients,
  listConfirmedSubscribers,
  markDeliveryComplete,
  markInboundComplete,
  pendingRecipients,
  quarantineLifecycleMailJob,
  releaseNotificationLock,
} from "@/lib/subscribers-store";

beforeEach(() => {
  process.env.MAIL_IDEMPOTENCY_SECRET = "mail-test-secret";
  redisCommand.mockReset();
  redisPipeline.mockReset();
});

describe("subscriber lifecycle", () => {
  it("does not confirm when a confirmation token is inspected on GET", async () => {
    redisCommand.mockResolvedValueOnce("reader@example.com");
    redisPipeline.mockResolvedValueOnce([[], [], []]);

    await expect(isConfirmationTokenValid("opaque-token")).resolves.toBe(true);
    await expect(listConfirmedSubscribers()).resolves.toEqual([]);

    expect(redisCommand.mock.calls.flat(2)).not.toContain("SADD");
  });

  it("confirms exactly once by atomically consuming the token", async () => {
    redisCommand
      .mockResolvedValueOnce(["reader@example.com", "welcome-job"])
      .mockResolvedValueOnce(null);

    await expect(confirmSubscriber("opaque-token")).resolves.toEqual({
      status: "confirmed",
      email: "reader@example.com",
      welcomeJobId: "welcome-job",
    });
    await expect(confirmSubscriber("opaque-token")).resolves.toEqual({ status: "invalid" });

    expect(redisCommand).toHaveBeenCalledTimes(2);
    expect(redisCommand.mock.calls[0]?.[0]?.[0]).toBe("EVAL");
  });

  it("creates an opaque 48-hour pending token and reuses it while valid", async () => {
    redisCommand.mockImplementationOnce(async (command: unknown[]) => [command[12], command[10]]);

    const token = await createPendingSubscriber(" Reader@Example.com ");

    expect(token).not.toContain("reader@example.com");
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(redisCommand).toHaveBeenCalledWith(expect.arrayContaining([48 * 60 * 60]));
    expect(redisCommand.mock.calls[0]?.[0]?.[0]).toBe("EVAL");

    redisCommand.mockReset();
    redisCommand.mockResolvedValueOnce(["confirmation-job", token]);

    await expect(createPendingSubscriber("reader@example.com")).resolves.toBe(token);
    expect(redisCommand).toHaveBeenCalledTimes(1);
  });

  it("durably enqueues confirmation delivery with the pending transition", async () => {
    redisCommand.mockResolvedValueOnce(["confirmation-job", "opaque-token"]);

    await createPendingSubscriber("reader@example.com");

    const command = redisCommand.mock.calls[0]?.[0] as unknown[];
    const addressHash = createHash("sha256").update("reader@example.com").digest("hex");
    expect(command[0]).toBe("EVAL");
    expect(command).toContain("mail:queue:confirmation");
    expect(command).toContain(`mail:job:confirmation:${addressHash}`);
  });

  it("durably enqueues welcome delivery in the atomic confirmation transition", async () => {
    redisCommand.mockResolvedValueOnce(["reader@example.com", "welcome-job"]);

    await expect(confirmSubscriber("opaque-token")).resolves.toEqual({
      status: "confirmed",
      email: "reader@example.com",
      welcomeJobId: "welcome-job",
    });

    const command = redisCommand.mock.calls[0]?.[0] as unknown[];
    const welcomeJobId = createHash("sha256").update("opaque-token").digest("hex");
    expect(command).toContain("mail:queue:welcome");
    expect(command).toContain(`mail:job:welcome:${welcomeJobId}`);
  });

  it("reads legacy and current confirmed sets but excludes suppressed addresses", async () => {
    redisPipeline.mockResolvedValueOnce([
      ["legacy@example.com", "both@example.com"],
      ["current@example.com", "both@example.com", "suppressed@example.com"],
      ["suppressed@example.com"],
    ]);

    await expect(listConfirmedSubscribers()).resolves.toEqual([
      "both@example.com",
      "current@example.com",
      "legacy@example.com",
    ]);
  });
});

describe("delivery retry state", () => {
  it("charges empty set members against the candidate work budget", async () => {
    redisCommand
      .mockResolvedValueOnce(["0", 1, 1, ""])
      .mockResolvedValueOnce(["0", 1, 1]);

    const page = await listPendingNotificationRecipients(
      "hello-world",
      createNotificationRecipientScan(),
      1,
      8,
    );

    expect(page).toMatchObject({ recipients: [], work: 3, exhausted: true });
  });

  it("pages a large confirmed-recipient set with bounded sequential Redis work", async () => {
    const legacy = Array.from({ length: 500 }, (_, index) => `legacy-${index}@example.com`);
    const current = Array.from({ length: 500 }, (_, index) => `current-${index}@example.com`);
    const redisBuffers = new Map<string, string[]>();
    let activeReads = 0;
    let peakReads = 0;
    let peakReturnedScanItems = 0;
    redisCommand.mockImplementation(async (command: unknown[]) => {
      activeReads += 1;
      peakReads = Math.max(peakReads, activeReads);
      await Promise.resolve();
      activeReads -= 1;

      if (command[0] === "SSCAN") {
        const items = command[1] === "subscribers" ? legacy : current;
        peakReturnedScanItems = Math.max(peakReturnedScanItems, items.length);
        return ["0", items];
      }
      if (command[0] === "EVAL" && String(command[1]).includes("SSCAN")) {
        const setKey = String(command[3]);
        const bufferKey = String(command[4]);
        const limit = Number(command[8]);
        const buffered = redisBuffers.get(bufferKey) ?? [];
        const returned = buffered.splice(0, limit);
        const scanComplete = command[6] === "1";

        if (returned.length < limit && !scanComplete) {
          const scanned = setKey === "subscribers" ? legacy : current;
          const needed = limit - returned.length;
          returned.push(...scanned.slice(0, needed));
          buffered.push(...scanned.slice(needed));
        }
        redisBuffers.set(bufferKey, buffered);
        peakReturnedScanItems = Math.max(peakReturnedScanItems, returned.length);
        return ["0", 1, buffered.length === 0 ? 1 : 0, ...returned];
      }
      if (command[0] === "SISMEMBER") return 0;
      if (command[0] === "EVAL") return `recipient-${String(command[3]).slice(-12)}`;
      throw new Error("unexpected Redis command");
    });

    const scan = createNotificationRecipientScan();
    const recipients: string[] = [];
    let firstPage: string[] = [];
    while (true) {
      const page = await listPendingNotificationRecipients("hello-world", scan, 4, 32);
      if (recipients.length === 0) firstPage = page.recipients.map(({ email }) => email);
      recipients.push(...page.recipients.map(({ email }) => email));
      expect(page.recipients).toHaveLength(Math.min(4, 1_000 - recipients.length + page.recipients.length));
      expect(page.work).toBeLessThanOrEqual(32);
      if (page.exhausted) break;
    }

    expect(firstPage).toEqual([
      "legacy-0@example.com",
      "current-0@example.com",
      "legacy-1@example.com",
      "current-1@example.com",
    ]);
    expect(recipients).toHaveLength(1_000);
    expect(new Set(recipients)).toHaveLength(1_000);
    expect(JSON.stringify(scan)).not.toContain("@example.com");
    expect(peakReturnedScanItems).toBeLessThanOrEqual(4);
    expect(peakReads).toBe(1);
    expect(redisCommand.mock.calls.some(([command]) => command[0] === "SMEMBERS")).toBe(false);
    expect(
      redisCommand.mock.calls
        .filter(([command]) => command[0] === "EVAL" && String(command[1]).includes("SSCAN"))
        .every(([command]) => Number(command[8]) <= 4),
    ).toBe(true);
  });

  it("charges invalid and duplicate scanned addresses against the work budget", async () => {
    const queued = new Map<string, string[]>([
      ["subscribers", ["reader@example.com", "not-an-email", "reader@example.com"]],
      ["subscribers:confirmed", []],
    ]);
    redisCommand.mockImplementation(async (command: unknown[]) => {
      if (command[0] === "EVAL" && String(command[1]).includes("SSCAN")) {
        const values = queued.get(String(command[3])) ?? [];
        const value = values.shift();
        return ["0", 1, values.length === 0 ? 1 : 0, ...(value ? [value] : [])];
      }
      if (command[0] === "SISMEMBER") return 0;
      if (command[0] === "EVAL") return "stable-recipient-id";
      throw new Error("unexpected Redis command");
    });

    const page = await listPendingNotificationRecipients(
      "hello-world",
      createNotificationRecipientScan(),
      4,
      32,
    );

    expect(page.recipients).toEqual([
      { email: "reader@example.com", recipientId: "stable-recipient-id" },
    ]);
    expect(page.work).toBe(redisCommand.mock.calls.length + 3);
  });

  it("skips a recipient already completed on retry", async () => {
    const completed = new Set<string>();
    redisCommand.mockImplementation(async (command: unknown[]) => {
      if (command[0] === "EVAL" && command.includes("notification:hello-world:completed")) {
        completed.add(String(command.at(-1)));
        return 1;
      }
      if (command[0] === "EVAL") return "stable-recipient-id";
      if (command[0] === "SISMEMBER") return completed.has(String(command.at(-1))) ? 1 : 0;
      throw new Error("unexpected redis command");
    });

    await markDeliveryComplete("hello-world", "stable-recipient-id");

    await expect(pendingRecipients("hello-world", ["reader@example.com"])).resolves.toEqual([]);
  });

  it("persists completion and pre-send state in one Redis transition", async () => {
    redisCommand.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

    await markDeliveryComplete("hello-world", "stable-recipient-id");
    await markInboundComplete("verified-event-id");

    const postCommand = redisCommand.mock.calls[0]?.[0] as unknown[];
    const inboundCommand = redisCommand.mock.calls[1]?.[0] as unknown[];
    expect(postCommand[0]).toBe("EVAL");
    expect(postCommand).toContain("notification:hello-world:completed");
    expect(postCommand.some((value) => String(value).startsWith("mail:attempt:"))).toBe(true);
    expect(inboundCommand[0]).toBe("EVAL");
    expect(inboundCommand).toContain("inbound:completed");
    expect(inboundCommand.some((value) => String(value).startsWith("mail:attempt:"))).toBe(true);
  });

  it("classifies an unfinished delivery as ambiguous after the provider window", async () => {
    const subscribersStore = await import("@/lib/subscribers-store");
    const beginDeliveryAttempt = Reflect.get(subscribersStore, "beginDeliveryAttempt") as
      | ((deliveryId: string, nowMs: number) => Promise<string>)
      | undefined;
    expect(beginDeliveryAttempt).toEqual(expect.any(Function));

    let firstAttempt: number | null = null;
    redisCommand.mockImplementation(async (command: unknown[]) => {
      const now = Number(command.at(-2));
      const safeWindow = Number(command.at(-1));
      if (firstAttempt === null) {
        firstAttempt = now;
        return "ready";
      }
      return now - firstAttempt >= safeWindow ? "ambiguous" : "ready";
    });

    await expect(beginDeliveryAttempt?.("post:hello-world:recipient-id", 1_000)).resolves.toBe("ready");
    await expect(
      beginDeliveryAttempt?.("post:hello-world:recipient-id", 1_000 + 24 * 60 * 60 * 1_000),
    ).resolves.toBe("ambiguous");
  });

  it("uses a stable opaque id rather than an address in completion state", async () => {
    redisCommand.mockResolvedValueOnce(1);

    await markDeliveryComplete("hello-world", "stable-recipient-id");

    expect(JSON.stringify(redisCommand.mock.calls)).toContain("stable-recipient-id");
    expect(JSON.stringify(redisCommand.mock.calls)).not.toContain("reader@example.com");
  });

  it("keeps completed recipients complete when the idempotency secret rotates", async () => {
    const completed = new Set<string>();
    redisCommand.mockImplementation(async (command: unknown[]) => {
      if (command[0] === "EVAL" && command.includes("notification:hello-world:completed")) {
        completed.add(String(command.at(-1)));
        return 1;
      }
      if (command[0] === "EVAL") return "stable-recipient-id";
      if (command[0] === "SISMEMBER") return completed.has(String(command.at(-1))) ? 1 : 0;
      throw new Error("unexpected redis command");
    });

    await markDeliveryComplete("hello-world", "stable-recipient-id");
    process.env.MAIL_IDEMPOTENCY_SECRET = "rotated-mail-secret";

    await expect(pendingRecipients("hello-world", ["reader@example.com"])).resolves.toEqual([]);
  });

  it("atomically moves an ambiguous lifecycle job out of the runnable queue", async () => {
    redisCommand.mockResolvedValueOnce(1);

    await quarantineLifecycleMailJob("welcome", "ambiguous-job");

    const command = redisCommand.mock.calls[0]?.[0] as unknown[];
    expect(command[0]).toBe("EVAL");
    expect(command).toContain("mail:queue:welcome");
    expect(command).toContain("mail:quarantine:welcome");
    expect(command).toContain("ambiguous-job");
  });

  it("bounds cursor-scanned lifecycle payload reads for a large backlog", async () => {
    const confirmationIds = Array.from({ length: 500 }, (_, index) => `confirmation-${index}`);
    const welcomeIds = Array.from({ length: 500 }, (_, index) => `welcome-${index}`);
    let activePayloadReads = 0;
    let peakPayloadReads = 0;
    redisCommand.mockImplementation(async (command: unknown[]) => {
      if (command[0] === "SSCAN") {
        return [
          "0",
          command[1] === "mail:queue:confirmation" ? confirmationIds : welcomeIds,
        ];
      }
      if (command[0] === "GET") {
        activePayloadReads += 1;
        peakPayloadReads = Math.max(peakPayloadReads, activePayloadReads);
        await Promise.resolve();
        activePayloadReads -= 1;
        const key = String(command[1]);
        return key.includes(":confirmation:")
          ? "reader@example.com\nconfirmation-token"
          : "reader@example.com";
      }
      throw new Error("unexpected redis command");
    });

    const result = await listLifecycleMailJobs(createLifecycleMailScan(), 4, 16);

    expect(result.jobs).toHaveLength(4);
    expect(result.jobs.map(({ kind }) => kind)).toEqual([
      "confirmation",
      "welcome",
      "confirmation",
      "welcome",
    ]);
    expect(redisCommand.mock.calls.filter(([command]) => command[0] === "GET")).toHaveLength(4);
    expect(peakPayloadReads).toBe(1);
    expect(
      redisCommand.mock.calls
        .filter(([command]) => command[0] === "SSCAN")
        .every(([command]) => command.includes("COUNT") && Number(command.at(-1)) <= 4),
    ).toBe(true);
  });

  it("retains scanned ids when the current Redis work budget is exhausted", async () => {
    redisCommand.mockResolvedValueOnce(["0", ["confirmation-0"]]);
    const scan = createLifecycleMailScan();

    await expect(listLifecycleMailJobs(scan, 1, 1)).resolves.toMatchObject({
      jobs: [],
      work: 1,
    });

    expect(scan.confirmation.pendingIds).toEqual(["confirmation-0"]);
  });
});

describe("notification locks", () => {
  it("acquires a five-minute lock and releases only through a compare-and-delete script", async () => {
    redisCommand.mockResolvedValueOnce("OK").mockResolvedValueOnce(1);

    const token = await acquireNotificationLock("hello-world");
    expect(token).toEqual(expect.any(String));
    expect(redisCommand).toHaveBeenNthCalledWith(1, [
      "SET",
      "notification:hello-world:lock",
      token,
      "NX",
      "EX",
      300,
    ]);

    await releaseNotificationLock("hello-world", token as string);
    expect(redisCommand.mock.calls[1]?.[0]?.[0]).toBe("EVAL");
    expect(redisCommand.mock.calls[1]?.[0]).toContain(token);
  });

  it("reports a held notification lock without manufacturing a token", async () => {
    redisCommand.mockResolvedValueOnce(null);
    await expect(acquireNotificationLock("hello-world")).resolves.toBeNull();
  });

  it("renews only the lock token that still owns the lease", async () => {
    const subscribersStore = await import("@/lib/subscribers-store");
    const renewNotificationLock = Reflect.get(subscribersStore, "renewNotificationLock") as
      | ((slug: string, token: string) => Promise<boolean>)
      | undefined;
    expect(renewNotificationLock).toEqual(expect.any(Function));
    redisCommand.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expect(renewNotificationLock?.("hello-world", "owner-token")).resolves.toBe(true);
    await expect(renewNotificationLock?.("hello-world", "stale-token")).resolves.toBe(false);

    const command = redisCommand.mock.calls[0]?.[0] as unknown[];
    expect(command[0]).toBe("EVAL");
    expect(command).toContain("notification:hello-world:lock");
    expect(command).toContain("owner-token");
  });
});
