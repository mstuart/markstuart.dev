import { createHash } from "node:crypto";

import { site } from "@/lib/data/site";
import { sendResendEmail } from "@/lib/server/resend";
import {
  beginDeliveryAttempt,
  completeLifecycleMailJob,
  createLifecycleMailScan,
  getLifecycleMailJob,
  getOrCreateUnsubscribeToken,
  listLifecycleMailJobs,
  quarantineLifecycleMailJob,
  type LifecycleMailKind,
} from "@/lib/subscribers-store";
import type { PostMeta } from "@/lib/types";

const FROM = "Mark Stuart <mark@markstuart.dev>";
const MAIL_TIMEOUT_MS = 8_000;

function tokenDigest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function unsubscribeUrl(token: string): string {
  const params = new URLSearchParams({ token });
  return `${site.url}/api/unsubscribe?${params}`;
}

function footer(token: string, topMargin = 32): { html: string; text: string } {
  const url = unsubscribeUrl(token);
  return {
    html: `<p style="margin:${topMargin}px 0 0;font-size:13px;line-height:1.6;color:#a1a1aa">You're getting this because you subscribed at <a href="${site.url}" style="color:#71717a">markstuart.dev</a>. <a href="${url}" style="color:#71717a">Unsubscribe</a> anytime.</p>`,
    text: `\n\n---\nYou're getting this because you subscribed at ${site.url}. Unsubscribe: ${url}`,
  };
}

function unsubscribeHeaders(token: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl(token)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export async function sendConfirmationEmail(email: string, token: string): Promise<void> {
  const url = `${site.url}/subscribe/confirm?${new URLSearchParams({ token })}`;
  await sendResendEmail(
    {
      from: FROM,
      to: email,
      subject: "Confirm your markstuart.dev subscription",
      text: `Confirm your subscription by visiting ${url}. This link expires in 48 hours.`,
      html: `<div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:560px"><p>Confirm your subscription to markstuart.dev.</p><p><a href="${url}">Confirm subscription</a></p><p>This link expires in 48 hours.</p></div>`,
    },
    `confirm/${tokenDigest(token)}`,
    { timeoutMs: MAIL_TIMEOUT_MS },
  );
}

export async function sendWelcomeEmail(
  email: string,
  unsubscribeToken: string,
  deliveryId: string,
): Promise<void> {
  const f = footer(unsubscribeToken);
  const notifyTo = process.env.SUBSCRIPTION_NOTIFY_TO?.trim();
  await sendResendEmail(
    {
      from: FROM,
      to: email,
      ...(notifyTo ? { bcc: notifyTo } : {}),
      subject: "You're subscribed to markstuart.dev",
      headers: unsubscribeHeaders(unsubscribeToken),
      text: `Thanks for subscribing. You'll get one email when I publish something new; no other mail.${f.text}`,
      html: `<div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:560px"><p>Thanks for subscribing. You'll get one email when I publish something new; no other mail.</p>${f.html}</div>`,
    },
    `welcome/${deliveryId}`,
    { timeoutMs: MAIL_TIMEOUT_MS },
  );
}

export async function sendNewPostEmail(
  post: PostMeta,
  email: string,
  unsubscribeToken: string,
  recipientId: string,
): Promise<void> {
  const postUrl = `${site.url}/posts/${post.slug}`;
  const subject = `${post.title} - ${post.minutes} min read`;
  const teaser = post.teaser ?? post.description;
  const dateLabel = new Date(`${post.date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const f = footer(unsubscribeToken, 0);

  await sendResendEmail(
    {
      from: FROM,
      to: email,
      subject,
      headers: unsubscribeHeaders(unsubscribeToken),
      text: `${post.title}\n${dateLabel}\n\n${teaser}\n\nRead it (${post.minutes} min): ${postUrl}\n\n- Mark${f.text}`,
      html: `<div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#18181b"><span style="display:none;max-height:0;overflow:hidden">${post.description}</span><p style="margin:0 0 24px;font-size:13px;color:#a1a1aa">markstuart.dev &middot; ${dateLabel}</p><h1 style="margin:0 0 16px;font-size:26px;font-weight:600;line-height:1.25;letter-spacing:-0.01em">${post.title}</h1><p style="margin:0 0 20px;font-size:16px;line-height:1.65">${teaser}</p><p style="margin:0 0 28px;font-size:16px"><a href="${postUrl}" style="color:#0d9488;font-weight:500">Read it on markstuart.dev</a> <span style="color:#a1a1aa">&middot; ${post.minutes} min</span></p><p style="margin:0 0 32px;font-size:16px;color:#52525b">- Mark</p><hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 16px">${f.html}</div>`,
    },
    `post/${post.slug}/${recipientId}`,
    { timeoutMs: MAIL_TIMEOUT_MS },
  );
}

export class MailDeliveryAmbiguousError extends Error {
  constructor() {
    super("Mail delivery requires operator reconciliation");
  }
}

async function sendLifecycleMail(send: () => Promise<void>): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await send();
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function processLifecycleMailJob(
  kind: LifecycleMailKind,
  id: string,
  loadedJob?: Awaited<ReturnType<typeof getLifecycleMailJob>>,
): Promise<void> {
  const job = loadedJob ?? (await getLifecycleMailJob(kind, id));
  if (!job) return;
  let deliveryId: string;
  let send: () => Promise<void>;
  if (kind === "confirmation") {
    const token = job.token;
    if (!token) throw new Error("Confirmation delivery is not configured");
    deliveryId = tokenDigest(token);
    send = () => sendConfirmationEmail(job.email, token);
  } else {
    deliveryId = id;
    send = async () => {
      const unsubscribeToken = await getOrCreateUnsubscribeToken(job.email);
      await sendWelcomeEmail(job.email, unsubscribeToken, id);
    };
  }
  const attempt = await beginDeliveryAttempt(`lifecycle:${kind}:${deliveryId}`);
  if (attempt === "ambiguous") throw new MailDeliveryAmbiguousError();
  if (attempt === "complete") {
    await completeLifecycleMailJob(kind, id, deliveryId);
    return;
  }

  await sendLifecycleMail(send);
  await completeLifecycleMailJob(kind, id, deliveryId);
}

export async function processQueuedLifecycleMailJobs(
  limit = 4,
): Promise<{ completed: number; failed: number }> {
  const scan = createLifecycleMailScan();
  let runnableHandled = 0;
  let completed = 0;
  let failed = 0;
  const boundedLimit = Math.max(0, limit);
  const maxScanWork = Math.max(16, boundedLimit * 8);
  let scanWork = 0;

  while (runnableHandled < boundedLimit && scanWork < maxScanWork) {
    const page = await listLifecycleMailJobs(
      scan,
      Math.min(2, boundedLimit - runnableHandled),
      maxScanWork - scanWork,
    );
    scanWork += page.work;
    if (page.jobs.length === 0) {
      if (page.exhausted || page.work === 0) break;
      continue;
    }

    await Promise.all(
      page.jobs.map(async (job) => {
        let quarantined = false;
        try {
          await processLifecycleMailJob(job.kind, job.id, job);
          completed += 1;
        } catch (error) {
          failed += 1;
          if (error instanceof MailDeliveryAmbiguousError) {
            quarantined = true;
            try {
              await quarantineLifecycleMailJob(job.kind, job.id);
            } catch {
              // A later drain may retry quarantine; keep scanning this batch.
            }
          }
        } finally {
          if (!quarantined) runnableHandled += 1;
        }
      }),
    );
    if (page.exhausted) break;
  }

  return { completed, failed };
}
