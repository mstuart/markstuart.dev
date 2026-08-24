import { createHash, randomBytes, randomUUID } from "node:crypto";

import { redisCommand, redisConfig, redisPipeline } from "@/lib/server/redis";

const LEGACY_CONFIRMED_KEY = "subscribers";
const CONFIRMED_KEY = "subscribers:confirmed";
const SUPPRESSED_KEY = "subscribers:suppressed";
const NOTIFIED_KEY = "notified_posts";
const INBOUND_COMPLETED_KEY = "inbound:completed";
const CONFIRMATION_QUEUE_KEY = "mail:queue:confirmation";
const WELCOME_QUEUE_KEY = "mail:queue:welcome";
const CONFIRMATION_QUARANTINE_KEY = "mail:quarantine:confirmation";
const WELCOME_QUARANTINE_KEY = "mail:quarantine:welcome";
const CONFIRMATION_TTL_SECONDS = 48 * 60 * 60;
const LIFECYCLE_QUARANTINE_TTL_SECONDS = 48 * 60 * 60;
const DELIVERY_RETRY_WINDOW_MS = 23 * 60 * 60 * 1_000;
const RECIPIENT_SCAN_BUFFER_TTL_SECONDS = 60 * 60;
const LIFECYCLE_SCAN_BUFFER_TTL_SECONDS = 60 * 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CONFIRM_SCRIPT = [
  "local email = redis.call('GET', KEYS[1])",
  "if not email then return nil end",
  "redis.call('DEL', KEYS[1])",
  "redis.call('SADD', KEYS[2], email)",
  "redis.call('SREM', KEYS[3], email)",
  "redis.call('SET', KEYS[4], email)",
  "redis.call('SADD', KEYS[5], ARGV[1])",
  "return {email, ARGV[1]}",
].join("\n");

const QUEUE_CONFIRMATION_SCRIPT = [
  "local legacy = redis.call('SISMEMBER', KEYS[1], ARGV[2])",
  "local current = redis.call('SISMEMBER', KEYS[2], ARGV[2])",
  "local suppressed = redis.call('SISMEMBER', KEYS[3], ARGV[2])",
  "local existing = redis.call('GET', KEYS[4])",
  "if ARGV[4] ~= '1' then return nil end",
  "if (legacy == 1 or current == 1) and suppressed == 0 then return nil end",
  "local token = existing or ARGV[1]",
  "if not existing then",
  "  redis.call('SET', KEYS[4], token, 'EX', ARGV[5])",
  "  redis.call('SET', KEYS[5], ARGV[2], 'EX', ARGV[5])",
  "end",
  "redis.call('SET', KEYS[6], ARGV[2] .. '\\n' .. token, 'EX', ARGV[5])",
  "redis.call('SADD', KEYS[7], ARGV[3])",
  "return {ARGV[3], token}",
].join("\n");

const CREATE_UNSUBSCRIBE_TOKEN_SCRIPT = [
  "local existing = redis.call('GET', KEYS[1])",
  "if existing then return existing end",
  "redis.call('SET', KEYS[1], ARGV[1])",
  "redis.call('SET', KEYS[2], ARGV[2])",
  "return ARGV[1]",
].join("\n");

const UNSUBSCRIBE_SCRIPT = [
  "local email = redis.call('GET', KEYS[1])",
  "if not email then return nil end",
  "if email ~= ARGV[1] then return nil end",
  "redis.call('SREM', KEYS[2], email)",
  "redis.call('SREM', KEYS[3], email)",
  "redis.call('SADD', KEYS[4], email)",
  "redis.call('DEL', KEYS[5])",
  "redis.call('DEL', KEYS[1], KEYS[6])",
  "return email",
].join("\n");

const RELEASE_LOCK_SCRIPT = [
  "if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end",
  "return redis.call('DEL', KEYS[1])",
].join("\n");

const RENEW_LOCK_SCRIPT = [
  "if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end",
  "return redis.call('EXPIRE', KEYS[1], ARGV[2])",
].join("\n");

const CREATE_RECIPIENT_ID_SCRIPT = [
  "local existing = redis.call('GET', KEYS[1])",
  "if existing then return existing end",
  "redis.call('SET', KEYS[1], ARGV[1])",
  "return ARGV[1]",
].join("\n");

const BEGIN_DELIVERY_ATTEMPT_SCRIPT = [
  "local state = redis.call('GET', KEYS[1])",
  "if state == 'complete' then return 'complete' end",
  "if state then",
  "  local age = tonumber(ARGV[1]) - tonumber(state)",
  "  if age >= tonumber(ARGV[2]) then return 'ambiguous' end",
  "  return 'ready'",
  "end",
  "redis.call('SET', KEYS[1], ARGV[1])",
  "return 'ready'",
].join("\n");

const COMPLETE_DELIVERY_SCRIPT = [
  "redis.call('SET', KEYS[1], 'complete')",
  "return redis.call('SADD', KEYS[2], ARGV[1])",
].join("\n");

const COMPLETE_LIFECYCLE_JOB_SCRIPT = [
  "redis.call('SET', KEYS[1], 'complete')",
  "redis.call('DEL', KEYS[2])",
  "return redis.call('SREM', KEYS[3], ARGV[1])",
].join("\n");

const QUARANTINE_LIFECYCLE_JOB_SCRIPT = [
  "local removed = redis.call('SREM', KEYS[1], ARGV[1])",
  "redis.call('SADD', KEYS[2], ARGV[1])",
  "if tonumber(ARGV[2]) > 0 then redis.call('EXPIRE', KEYS[3], ARGV[2]) end",
  "return removed",
].join("\n");

const SCAN_CONFIRMED_RECIPIENTS_SCRIPT = [
  "local limit = tonumber(ARGV[4])",
  "local cursor = ARGV[1]",
  "local scan_complete = ARGV[2] == '1'",
  "local output = {}",
  "while #output < limit do",
  "  local buffered = redis.call('LPOP', KEYS[2])",
  "  if not buffered then break end",
  "  table.insert(output, buffered)",
  "end",
  "if #output < limit and not scan_complete then",
  "  local scanned = redis.call('SSCAN', KEYS[1], cursor, 'COUNT', ARGV[3])",
  "  cursor = scanned[1]",
  "  if cursor == '0' then scan_complete = true end",
  "  local values = scanned[2]",
  "  local index = 1",
  "  while #output < limit and index <= #values do",
  "    table.insert(output, values[index])",
  "    index = index + 1",
  "  end",
  "  while index <= #values do",
  "    redis.call('RPUSH', KEYS[2], values[index])",
  "    index = index + 1",
  "  end",
  "end",
  "local buffered_count = redis.call('LLEN', KEYS[2])",
  "if buffered_count > 0 then",
  "  redis.call('EXPIRE', KEYS[2], ARGV[5])",
  "else",
  "  redis.call('DEL', KEYS[2])",
  "end",
  "local exhausted = scan_complete and buffered_count == 0",
  "local result = {cursor, scan_complete and 1 or 0, exhausted and 1 or 0}",
  "for index = 1, #output do table.insert(result, output[index]) end",
  "return result",
].join("\n");

const SCAN_LIFECYCLE_JOBS_SCRIPT = [
  "local cursor = ARGV[1]",
  "local scan_complete = ARGV[2] == '1'",
  "local id = redis.call('LPOP', KEYS[2])",
  "if not id and not scan_complete then",
  "  local scanned = redis.call('SSCAN', KEYS[1], cursor, 'COUNT', ARGV[3])",
  "  cursor = scanned[1]",
  "  if cursor == '0' then scan_complete = true end",
  "  local values = scanned[2]",
  "  id = values[1]",
  "  for index = 2, #values do redis.call('RPUSH', KEYS[2], values[index]) end",
  "end",
  "local buffered_count = redis.call('LLEN', KEYS[2])",
  "if buffered_count > 0 then",
  "  redis.call('EXPIRE', KEYS[2], ARGV[4])",
  "else",
  "  redis.call('DEL', KEYS[2])",
  "end",
  "local exhausted = scan_complete and buffered_count == 0",
  "return {cursor, scan_complete and 1 or 0, exhausted and 1 or 0, id}",
].join("\n");

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length <= 254 && EMAIL_RE.test(normalized);
}

export type SubscriptionCapability = "storage" | "signup";
export type SubscriptionRequirement = "redis" | "rate_limit_secret" | "resend_api_key";
export type SubscriptionReadiness =
  | { ready: true }
  | { ready: false; missing: readonly SubscriptionRequirement[] };

export function getSubscriptionReadiness(
  capability: SubscriptionCapability,
): SubscriptionReadiness {
  const missing: SubscriptionRequirement[] = [];
  if (redisConfig() === null) missing.push("redis");
  if (capability === "signup") {
    if (!process.env.RATE_LIMIT_SECRET?.trim()) missing.push("rate_limit_secret");
    if (!process.env.RESEND_API_KEY?.trim()) missing.push("resend_api_key");
  }
  return missing.length === 0 ? { ready: true } : { ready: false, missing };
}

export function isSubscribeConfigured(): boolean {
  return getSubscriptionReadiness("storage").ready;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function confirmationKey(token: string): string {
  return `subscription:confirm:${sha256(token)}`;
}

function pendingKey(email: string): string {
  return `subscription:pending:${sha256(normalizeEmail(email))}`;
}

function recipientKey(email: string): string {
  return `subscription:recipient:${sha256(normalizeEmail(email))}`;
}

export type LifecycleMailKind = "confirmation" | "welcome";

export type LifecycleMailJob = {
  id: string;
  kind: LifecycleMailKind;
  email: string;
  token?: string;
};

type LifecycleQueueScan = {
  cursor: string;
  scanComplete: boolean;
  exhausted: boolean;
};

export type LifecycleMailScan = {
  token: string;
  confirmation: LifecycleQueueScan;
  welcome: LifecycleQueueScan;
  nextKind: LifecycleMailKind;
};

export type LifecycleMailPage = {
  jobs: LifecycleMailJob[];
  work: number;
  exhausted: boolean;
};

type NotificationRecipientQueueScan = {
  cursor: string;
  scanComplete: boolean;
  exhausted: boolean;
};

export type NotificationRecipientScan = {
  token: string;
  legacy: NotificationRecipientQueueScan;
  current: NotificationRecipientQueueScan;
  nextKind: "legacy" | "current";
};

export type PendingNotificationRecipient = {
  email: string;
  recipientId: string;
};

export type NotificationRecipientPage = {
  recipients: PendingNotificationRecipient[];
  work: number;
  exhausted: boolean;
};

function lifecycleQueueKey(kind: LifecycleMailKind): string {
  return kind === "confirmation" ? CONFIRMATION_QUEUE_KEY : WELCOME_QUEUE_KEY;
}

function lifecycleQuarantineKey(kind: LifecycleMailKind): string {
  return kind === "confirmation" ? CONFIRMATION_QUARANTINE_KEY : WELCOME_QUARANTINE_KEY;
}

function lifecycleJobKey(kind: LifecycleMailKind, id: string): string {
  return `mail:job:${kind}:${id}`;
}

export function createLifecycleMailScan(): LifecycleMailScan {
  const queue = (): LifecycleQueueScan => ({
    cursor: "0",
    scanComplete: false,
    exhausted: false,
  });
  return { token: randomUUID(), confirmation: queue(), welcome: queue(), nextKind: "confirmation" };
}

export function createNotificationRecipientScan(): NotificationRecipientScan {
  const queue = (): NotificationRecipientQueueScan => ({
    cursor: "0",
    scanComplete: false,
    exhausted: false,
  });
  return { token: randomUUID(), legacy: queue(), current: queue(), nextKind: "legacy" };
}

function deliveryAttemptKey(deliveryId: string): string {
  return `mail:attempt:${sha256(deliveryId)}`;
}

function unsubscribeAddressKey(token: string): string {
  return `subscription:unsubscribe:${sha256(token)}`;
}

function unsubscribeTokenKey(email: string): string {
  return `subscription:token:${sha256(normalizeEmail(email))}`;
}

function opaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function queueConfirmationDelivery(
  email: string,
  allowed = true,
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const token = opaqueToken();
  const jobId = sha256(normalized);
  const result = await redisCommand<[string, string] | null>([
    "EVAL",
    QUEUE_CONFIRMATION_SCRIPT,
    7,
    LEGACY_CONFIRMED_KEY,
    CONFIRMED_KEY,
    SUPPRESSED_KEY,
    pendingKey(normalized),
    confirmationKey(token),
    lifecycleJobKey("confirmation", jobId),
    CONFIRMATION_QUEUE_KEY,
    token,
    normalized,
    jobId,
    allowed ? "1" : "0",
    CONFIRMATION_TTL_SECONDS,
  ]);
  return result?.[0] ?? null;
}

export async function createPendingSubscriber(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  const token = opaqueToken();
  const jobId = sha256(normalized);
  const result = await redisCommand<[string, string] | null>([
    "EVAL",
    QUEUE_CONFIRMATION_SCRIPT,
    7,
    LEGACY_CONFIRMED_KEY,
    CONFIRMED_KEY,
    SUPPRESSED_KEY,
    pendingKey(normalized),
    confirmationKey(token),
    lifecycleJobKey("confirmation", jobId),
    CONFIRMATION_QUEUE_KEY,
    token,
    normalized,
    jobId,
    "1",
    CONFIRMATION_TTL_SECONDS,
  ]);
  if (!result) throw new Error("Subscription is already confirmed");
  return result[1];
}

export async function isConfirmationTokenValid(token: string): Promise<boolean> {
  if (!token) return false;
  const email = await redisCommand<string | null>(["GET", confirmationKey(token)]);
  return Boolean(email);
}

export type ConfirmationResult =
  | { status: "confirmed"; email: string; welcomeJobId: string }
  | { status: "invalid" };

export async function confirmSubscriber(token: string): Promise<ConfirmationResult> {
  if (!token) return { status: "invalid" };
  const welcomeJobId = sha256(token);
  const result = await redisCommand<[string, string] | null>([
    "EVAL",
    CONFIRM_SCRIPT,
    5,
    confirmationKey(token),
    CONFIRMED_KEY,
    SUPPRESSED_KEY,
    lifecycleJobKey("welcome", welcomeJobId),
    WELCOME_QUEUE_KEY,
    welcomeJobId,
  ]);
  return result
    ? { status: "confirmed", email: result[0], welcomeJobId: result[1] }
    : { status: "invalid" };
}

export async function isConfirmedSubscriber(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const [legacy, current, suppressed] = await redisPipeline<number>([
    ["SISMEMBER", LEGACY_CONFIRMED_KEY, normalized],
    ["SISMEMBER", CONFIRMED_KEY, normalized],
    ["SISMEMBER", SUPPRESSED_KEY, normalized],
  ]);
  return suppressed !== 1 && (legacy === 1 || current === 1);
}

export async function listConfirmedSubscribers(): Promise<string[]> {
  const [legacy, current, suppressed] = await redisPipeline<string[]>([
    ["SMEMBERS", LEGACY_CONFIRMED_KEY],
    ["SMEMBERS", CONFIRMED_KEY],
    ["SMEMBERS", SUPPRESSED_KEY],
  ]);
  const suppressedSet = new Set(suppressed.map(normalizeEmail));
  return [...new Set([...legacy, ...current].map(normalizeEmail))]
    .filter((email) => !suppressedSet.has(email))
    .sort();
}

export async function getOrCreateUnsubscribeToken(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  const existing = await redisCommand<string | null>(["GET", unsubscribeTokenKey(normalized)]);
  if (existing) return existing;

  const token = opaqueToken();
  return redisCommand<string>([
    "EVAL",
    CREATE_UNSUBSCRIBE_TOKEN_SCRIPT,
    2,
    unsubscribeTokenKey(normalized),
    unsubscribeAddressKey(token),
    token,
    normalized,
  ]);
}

export async function isUnsubscribeTokenValid(token: string): Promise<boolean> {
  if (!token) return false;
  return Boolean(await redisCommand<string | null>(["GET", unsubscribeAddressKey(token)]));
}

export type UnsubscribeResult = { status: "unsubscribed" } | { status: "invalid" };

export async function unsubscribeSubscriber(token: string): Promise<UnsubscribeResult> {
  if (!token) return { status: "invalid" };
  const tokenKey = unsubscribeAddressKey(token);
  const email = await redisCommand<string | null>(["GET", tokenKey]);
  if (!email) return { status: "invalid" };

  const removed = await redisCommand<string | null>([
    "EVAL",
    UNSUBSCRIBE_SCRIPT,
    6,
    tokenKey,
    LEGACY_CONFIRMED_KEY,
    CONFIRMED_KEY,
    SUPPRESSED_KEY,
    pendingKey(email),
    unsubscribeTokenKey(email),
    email,
  ]);
  return removed ? { status: "unsubscribed" } : { status: "invalid" };
}

export async function getOrCreateRecipientId(email: string): Promise<string> {
  return redisCommand<string>([
    "EVAL",
    CREATE_RECIPIENT_ID_SCRIPT,
    1,
    recipientKey(email),
    opaqueToken(),
  ]);
}

function completedKey(slug: string): string {
  return `notification:${slug}:completed`;
}

function postDeliveryId(slug: string, recipientId: string): string {
  return `post:${slug}:${recipientId}`;
}

export type DeliveryAttemptStatus = "ready" | "complete" | "ambiguous";

export async function beginDeliveryAttempt(
  deliveryId: string,
  nowMs = Date.now(),
): Promise<DeliveryAttemptStatus> {
  return redisCommand<DeliveryAttemptStatus>([
    "EVAL",
    BEGIN_DELIVERY_ATTEMPT_SCRIPT,
    1,
    deliveryAttemptKey(deliveryId),
    nowMs,
    DELIVERY_RETRY_WINDOW_MS,
  ]);
}

export async function markDeliveryComplete(slug: string, recipientId: string): Promise<void> {
  await redisCommand<number>([
    "EVAL",
    COMPLETE_DELIVERY_SCRIPT,
    2,
    deliveryAttemptKey(postDeliveryId(slug, recipientId)),
    completedKey(slug),
    recipientId,
  ]);
}

export async function pendingRecipients(slug: string, recipients: string[]): Promise<string[]> {
  if (recipients.length === 0) return [];
  const pending: string[] = [];
  for (const email of recipients) {
    const recipientId = await getOrCreateRecipientId(email);
    const completed = await redisCommand<number>([
      "SISMEMBER",
      completedKey(slug),
      recipientId,
    ]);
    if (completed !== 1) pending.push(email);
  }
  return pending;
}

function notificationRecipientScanExhausted(scan: NotificationRecipientScan): boolean {
  return (["legacy", "current"] as const).every((kind) => scan[kind].exhausted);
}

function confirmedKey(kind: "legacy" | "current"): string {
  return kind === "legacy" ? LEGACY_CONFIRMED_KEY : CONFIRMED_KEY;
}

function notificationRecipientBufferKey(
  scan: NotificationRecipientScan,
  kind: "legacy" | "current",
): string {
  return `notification:recipient-scan:${scan.token}:${kind}`;
}

async function scanNotificationRecipient(
  scan: NotificationRecipientScan,
  kind: "legacy" | "current",
  count: number,
): Promise<string | null> {
  const queue = scan[kind];
  const result = await redisCommand<Array<string | number>>([
    "EVAL",
    SCAN_CONFIRMED_RECIPIENTS_SCRIPT,
    2,
    confirmedKey(kind),
    notificationRecipientBufferKey(scan, kind),
    queue.cursor,
    queue.scanComplete ? "1" : "0",
    count,
    1,
    RECIPIENT_SCAN_BUFFER_TTL_SECONDS,
  ]);
  queue.cursor = String(result[0] ?? "0");
  queue.scanComplete = result[1] === 1;
  queue.exhausted = result[2] === 1;
  return result[3] === undefined ? null : String(result[3]);
}

export async function releaseNotificationRecipientScan(
  scan: NotificationRecipientScan,
): Promise<void> {
  await redisPipeline<number>([
    ["DEL", notificationRecipientBufferKey(scan, "legacy")],
    ["DEL", notificationRecipientBufferKey(scan, "current")],
  ]);
}

export async function listPendingNotificationRecipients(
  slug: string,
  scan: NotificationRecipientScan,
  limit: number,
  workLimit: number,
): Promise<NotificationRecipientPage> {
  const recipients: PendingNotificationRecipient[] = [];
  const pageEmails = new Set<string>();
  const boundedLimit = Math.max(0, Math.floor(limit));
  const boundedWorkLimit = Math.max(0, Math.floor(workLimit));
  let work = 0;

  while (
    recipients.length < boundedLimit &&
    work < boundedWorkLimit &&
    !notificationRecipientScanExhausted(scan)
  ) {
    const kind = scan.nextKind;
    scan.nextKind = kind === "legacy" ? "current" : "legacy";
    const queue = scan[kind];
    if (queue.exhausted) continue;

    const requiredWork = kind === "current" ? 6 : 5;
    if (boundedWorkLimit - work < requiredWork) break;

    const count = Math.max(1, Math.min(boundedLimit - recipients.length, boundedWorkLimit - work));
    const rawEmail = await scanNotificationRecipient(scan, kind, count);
    work += 1;
    if (rawEmail === null) continue;
    work += 1;
    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email) || pageEmails.has(email)) continue;

    const suppressed = await redisCommand<number>(["SISMEMBER", SUPPRESSED_KEY, email]);
    work += 1;
    if (suppressed === 1) continue;

    if (kind === "current") {
      const inLegacySet = await redisCommand<number>([
        "SISMEMBER",
        LEGACY_CONFIRMED_KEY,
        email,
      ]);
      work += 1;
      if (inLegacySet === 1) continue;
    }

    const recipientId = await getOrCreateRecipientId(email);
    work += 1;
    const completed = await redisCommand<number>([
      "SISMEMBER",
      completedKey(slug),
      recipientId,
    ]);
    work += 1;
    if (completed === 1) continue;

    pageEmails.add(email);
    recipients.push({ email, recipientId });
  }

  return { recipients, work, exhausted: notificationRecipientScanExhausted(scan) };
}

function notificationLockKey(slug: string): string {
  return `notification:${slug}:lock`;
}

export async function acquireNotificationLock(slug: string): Promise<string | null> {
  const token = randomUUID();
  const result = await redisCommand<string | null>([
    "SET",
    notificationLockKey(slug),
    token,
    "NX",
    "EX",
    300,
  ]);
  return result === "OK" ? token : null;
}

export async function releaseNotificationLock(slug: string, token: string): Promise<void> {
  await redisCommand<number>([
    "EVAL",
    RELEASE_LOCK_SCRIPT,
    1,
    notificationLockKey(slug),
    token,
  ]);
}

export async function renewNotificationLock(slug: string, token: string): Promise<boolean> {
  const renewed = await redisCommand<number>([
    "EVAL",
    RENEW_LOCK_SCRIPT,
    1,
    notificationLockKey(slug),
    token,
    300,
  ]);
  return renewed === 1;
}

export async function isInboundComplete(eventId: string): Promise<boolean> {
  return (await redisCommand<number>(["SISMEMBER", INBOUND_COMPLETED_KEY, eventId])) === 1;
}

export async function markInboundComplete(eventId: string): Promise<void> {
  await redisCommand<number>([
    "EVAL",
    COMPLETE_DELIVERY_SCRIPT,
    2,
    deliveryAttemptKey(`inbound:${eventId}`),
    INBOUND_COMPLETED_KEY,
    eventId,
  ]);
}

export async function getLifecycleMailJob(
  kind: LifecycleMailKind,
  id: string,
): Promise<LifecycleMailJob | null> {
  const payload = await redisCommand<string | null>(["GET", lifecycleJobKey(kind, id)]);
  if (!payload) return null;
  if (kind === "welcome") return { id, kind, email: payload };
  const separator = payload.indexOf("\n");
  if (separator === -1) return null;
  return {
    id,
    kind,
    email: payload.slice(0, separator),
    token: payload.slice(separator + 1),
  };
}

function lifecycleScanExhausted(scan: LifecycleMailScan): boolean {
  return (["confirmation", "welcome"] as const).every((kind) => scan[kind].exhausted);
}

function lifecycleScanBufferKey(scan: LifecycleMailScan, kind: LifecycleMailKind): string {
  return `mail:queue-scan:${scan.token}:${kind}`;
}

async function scanLifecycleJobId(
  scan: LifecycleMailScan,
  kind: LifecycleMailKind,
  count: number,
): Promise<string | null> {
  const queue = scan[kind];
  const result = await redisCommand<Array<string | number>>([
    "EVAL",
    SCAN_LIFECYCLE_JOBS_SCRIPT,
    2,
    lifecycleQueueKey(kind),
    lifecycleScanBufferKey(scan, kind),
    queue.cursor,
    queue.scanComplete ? "1" : "0",
    count,
    LIFECYCLE_SCAN_BUFFER_TTL_SECONDS,
  ]);
  queue.cursor = String(result[0] ?? "0");
  queue.scanComplete = result[1] === 1;
  queue.exhausted = result[2] === 1;
  return result[3] === undefined ? null : String(result[3]);
}

export async function listLifecycleMailJobs(
  scan: LifecycleMailScan,
  limit: number,
  workLimit: number,
): Promise<LifecycleMailPage> {
  const jobs: LifecycleMailJob[] = [];
  const boundedLimit = Math.max(0, Math.floor(limit));
  const boundedWorkLimit = Math.max(0, Math.floor(workLimit));
  let work = 0;

  while (jobs.length < boundedLimit && work < boundedWorkLimit && !lifecycleScanExhausted(scan)) {
    const kind = scan.nextKind;
    scan.nextKind = kind === "confirmation" ? "welcome" : "confirmation";
    const queue = scan[kind];

    if (queue.exhausted) continue;
    if (boundedWorkLimit - work < 2) break;

    const count = Math.max(1, Math.min(boundedLimit - jobs.length, boundedWorkLimit - work));
    const id = await scanLifecycleJobId(scan, kind, count);
    work += 1;
    if (!id) continue;
    const job = await getLifecycleMailJob(kind, id);
    work += 1;
    if (job) jobs.push(job);
  }

  return { jobs, work, exhausted: lifecycleScanExhausted(scan) };
}

export async function quarantineLifecycleMailJob(
  kind: LifecycleMailKind,
  id: string,
): Promise<void> {
  await redisCommand<number>([
    "EVAL",
    QUARANTINE_LIFECYCLE_JOB_SCRIPT,
    3,
    lifecycleQueueKey(kind),
    lifecycleQuarantineKey(kind),
    lifecycleJobKey(kind, id),
    id,
    LIFECYCLE_QUARANTINE_TTL_SECONDS,
  ]);
}

export async function completeLifecycleMailJob(
  kind: LifecycleMailKind,
  id: string,
  deliveryId = id,
): Promise<void> {
  await redisCommand<number>([
    "EVAL",
    COMPLETE_LIFECYCLE_JOB_SCRIPT,
    3,
    deliveryAttemptKey(`lifecycle:${kind}:${deliveryId}`),
    lifecycleJobKey(kind, id),
    lifecycleQueueKey(kind),
    id,
  ]);
}

export async function getNotifiedSlugs(): Promise<string[]> {
  return redisCommand<string[]>(["SMEMBERS", NOTIFIED_KEY]);
}

export async function markNotified(slug: string): Promise<void> {
  await redisCommand<number>(["SADD", NOTIFIED_KEY, slug]);
}
