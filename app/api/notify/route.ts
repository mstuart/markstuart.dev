import { processQueuedLifecycleMailJobs, sendNewPostEmail } from "@/lib/mailer";
import { getAllPosts } from "@/lib/posts";
import { requireCron } from "@/lib/server/auth";
import { publicError } from "@/lib/server/http";
import { logServerError } from "@/lib/server/log";
import {
  acquireNotificationLock,
  beginDeliveryAttempt,
  createNotificationRecipientScan,
  getNotifiedSlugs,
  getOrCreateUnsubscribeToken,
  isSubscribeConfigured,
  listPendingNotificationRecipients,
  markDeliveryComplete,
  markNotified,
  releaseNotificationRecipientScan,
  releaseNotificationLock,
  renewNotificationLock,
} from "@/lib/subscribers-store";
import type { PendingNotificationRecipient } from "@/lib/subscribers-store";
import type { PostMeta } from "@/lib/types";

const RECIPIENT_PAGE_SIZE = 16;
const RECIPIENT_PAGE_WORK_LIMIT = 128;

type DeliverySummary = {
  sent: number;
  failed: number;
};

async function deliverAtConcurrencyTwo(
  post: PostMeta,
  recipients: PendingNotificationRecipient[],
  lockToken: string,
  correlationId: string,
): Promise<DeliverySummary> {
  let nextIndex = 0;
  let sent = 0;
  let failed = 0;

  async function worker(): Promise<void> {
    while (nextIndex < recipients.length) {
      const recipient = recipients[nextIndex];
      nextIndex += 1;
      if (!recipient) continue;
      const { email, recipientId } = recipient;
      try {
        if (!(await renewNotificationLock(post.slug, lockToken))) {
          throw new Error("Notification lock ownership was lost");
        }
        const attempt = await beginDeliveryAttempt(`post:${post.slug}:${recipientId}`);
        if (attempt === "complete") continue;
        if (attempt === "ambiguous") {
          throw new Error("Mail delivery requires operator reconciliation");
        }
        const unsubscribeToken = await getOrCreateUnsubscribeToken(email);
        await sendNewPostEmail(post, email, unsubscribeToken, recipientId);
        await markDeliveryComplete(post.slug, recipientId);
        sent += 1;
      } catch (error) {
        failed += 1;
        logServerError({
          correlationId,
          operation: "notification_recipient",
          code: "notification_recipient_delivery_failed",
          error,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(2, recipients.length) }, () => worker()));
  return { sent, failed };
}

async function deliverPendingRecipientPages(
  post: PostMeta,
  lockToken: string,
  correlationId: string,
): Promise<DeliverySummary> {
  const scan = createNotificationRecipientScan();
  let sent = 0;
  let failed = 0;

  try {
    while (true) {
      const page = await listPendingNotificationRecipients(
        post.slug,
        scan,
        RECIPIENT_PAGE_SIZE,
        RECIPIENT_PAGE_WORK_LIMIT,
      );
      if (!(await renewNotificationLock(post.slug, lockToken))) {
        throw new Error("Notification lock ownership was lost");
      }
      const delivery = await deliverAtConcurrencyTwo(
        post,
        page.recipients,
        lockToken,
        correlationId,
      );
      sent += delivery.sent;
      failed += delivery.failed;
      if (page.exhausted) return { sent, failed };
      if (page.work === 0) throw new Error("Notification recipient scan made no progress");
    }
  } finally {
    await releaseNotificationRecipientScan(scan);
  }
}

async function hasPendingRecipients(post: PostMeta, lockToken: string): Promise<boolean> {
  const scan = createNotificationRecipientScan();
  try {
    while (true) {
      const page = await listPendingNotificationRecipients(
        post.slug,
        scan,
        1,
        RECIPIENT_PAGE_WORK_LIMIT,
      );
      if (!(await renewNotificationLock(post.slug, lockToken))) {
        throw new Error("Notification lock ownership was lost");
      }
      if (page.recipients.length > 0) return true;
      if (page.exhausted) return false;
      if (page.work === 0) throw new Error("Notification recipient scan made no progress");
    }
  } finally {
    await releaseNotificationRecipientScan(scan);
  }
}

export async function GET(request: Request): Promise<Response> {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const correlationId = crypto.randomUUID();
  if (!isSubscribeConfigured()) {
    return Response.json({ configured: false, newPosts: 0, announced: [], sent: 0, failed: 0 });
  }

  try {
    const lifecycle = await processQueuedLifecycleMailJobs();
    if (lifecycle.failed > 0) {
      logServerError({
        correlationId,
        operation: "subscription_mail_retry",
        code: "notification_lifecycle_delivery_failed",
        counters: {
          lifecycleCompleted: lifecycle.completed,
          lifecycleFailed: lifecycle.failed,
        },
        error: new Error("Lifecycle mail delivery failed"),
      });
    }
    const notified = new Set(await getNotifiedSlugs());
    // A post is already announced if its current slug OR any slug it was
    // previously published under is in the notified set. This prevents a slug
    // rename from re-announcing an existing post to subscribers.
    const isAnnounced = (post: PostMeta) =>
      notified.has(post.slug) || (post.previousSlugs ?? []).some((slug) => notified.has(slug));
    const fresh = getAllPosts().filter((post) => !post.sample && !isAnnounced(post));
    const announced: string[] = [];
    let sent = 0;
    let failed = 0;

    for (const post of fresh) {
      const lockToken = await acquireNotificationLock(post.slug);
      if (!lockToken) {
        return publicError("notification_in_progress", 409, correlationId);
      }

      try {
        const delivery = await deliverPendingRecipientPages(post, lockToken, correlationId);
        sent += delivery.sent;
        failed += delivery.failed;

        if (!(await hasPendingRecipients(post, lockToken))) {
          await markNotified(post.slug);
          announced.push(post.slug);
        }
      } finally {
        await releaseNotificationLock(post.slug, lockToken);
      }
    }

    if (lifecycle.failed > 0 || failed > 0) {
      const counters = {
        lifecycleCompleted: lifecycle.completed,
        lifecycleFailed: lifecycle.failed,
        recipientSent: sent,
        recipientFailed: failed,
        postsAnnounced: announced.length,
      };
      logServerError({
        correlationId,
        operation: "notify",
        code: "notification_delivery_failed",
        counters,
        error: new Error("Notification delivery failed"),
      });
      return Response.json(
        {
          error: { code: "notification_delivery_failed", correlationId },
          configured: true,
          newPosts: announced.length,
          announced,
          sent,
          failed,
          counters,
        },
        {
          status: 502,
          headers: { "X-Robots-Tag": "noindex" },
        },
      );
    }

    return Response.json({
      configured: true,
      newPosts: announced.length,
      announced,
      sent,
      failed,
    });
  } catch (error) {
    logServerError({
      correlationId,
      operation: "notify",
      code: "notification_run_failed",
      error,
    });
    return publicError("notification_failed", 500, correlationId);
  }
}
