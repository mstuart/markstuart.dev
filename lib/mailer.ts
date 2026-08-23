import { createHmac, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { site } from "@/lib/data/site";
import type { PostMeta } from "@/lib/types";

// Subscriber email sending via Resend (provisioned through Vercel; domain
// verified). Every message carries a signed per-recipient unsubscribe link
// plus a List-Unsubscribe header so Gmail shows its native unsubscribe.

const FROM = "Mark Stuart <mark@markstuart.dev>";

export function unsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error("UNSUBSCRIBE_SECRET not set");
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

function unsubscribeUrl(email: string): string {
  const params = new URLSearchParams({ email, token: unsubscribeToken(email) });
  return `${site.url}/api/unsubscribe?${params}`;
}

function footer(email: string, topMargin = 32): { html: string; text: string } {
  const url = unsubscribeUrl(email);
  return {
    html: `<p style="margin:${topMargin}px 0 0;font-size:13px;line-height:1.6;color:#a1a1aa">You're getting this because you subscribed at <a href="${site.url}" style="color:#71717a">markstuart.dev</a>. <a href="${url}" style="color:#71717a">Unsubscribe</a> anytime.</p>`,
    text: `\n\n—\nYou're getting this because you subscribed at ${site.url}. Unsubscribe: ${url}`,
  };
}

function headers(email: string) {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl(email)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const f = footer(email);
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "You're subscribed to markstuart.dev",
    headers: headers(email),
    text: `Thanks for subscribing. You'll get one email when I publish something new — no other mail.${f.text}`,
    html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px"><p>Thanks for subscribing. You'll get one email when I publish something new — no other mail.</p>${f.html}</div>`,
  });
  if (error) throw new Error(error.message);
}

/**
 * Send one new-post announcement to every subscriber. Returns count sent.
 *
 * Template follows the researched conventions of real developer newsletters:
 * the title itself is the subject (no "New post:" prefix) with a reading-time
 * tag, a hidden preheader extends the subject, the teaser is authored
 * first-person copy in full-strength text, and the single click target is one
 * plain teal link. No images, no buttons, no logo.
 */
export async function sendNewPostEmails(post: PostMeta, subscribers: string[]): Promise<number> {
  if (subscribers.length === 0) return 0;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const postUrl = `${site.url}/posts/${post.slug}`;
  const subject = `${post.title} — ${post.minutes} min read`;
  const teaser = post.teaser ?? post.description;
  const preheader = post.description;
  const dateLabel = new Date(`${post.date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  // Individual sends, paced under Resend's rate limit. Gmail discarded a
  // same-second batch from this young domain; the single-send path delivers.
  let sent = 0;
  for (const email of subscribers) {
    const f = footer(email, 0);
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      headers: headers(email),
      text: `${post.title}\n${dateLabel}\n\n${teaser}\n\nRead it (${post.minutes} min): ${postUrl}\n\n— Mark${f.text}`,
      html: `<div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#18181b"><span style="display:none;max-height:0;overflow:hidden">${preheader}</span><p style="margin:0 0 24px;font-size:13px;color:#a1a1aa">markstuart.dev &middot; ${dateLabel}</p><h1 style="margin:0 0 16px;font-size:26px;font-weight:600;line-height:1.25;letter-spacing:-0.01em">${post.title}</h1><p style="margin:0 0 20px;font-size:16px;line-height:1.65">${teaser}</p><p style="margin:0 0 28px;font-size:16px"><a href="${postUrl}" style="color:#0d9488;font-weight:500">Read it on markstuart.dev</a> <span style="color:#a1a1aa">&middot; ${post.minutes} min</span></p><p style="margin:0 0 32px;font-size:16px;color:#52525b">— Mark</p><hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 16px">${f.html}</div>`,
    });
    if (error) throw new Error(error.message);
    sent += 1;
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  return sent;
}
