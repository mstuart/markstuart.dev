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

function footer(email: string): { html: string; text: string } {
  const url = unsubscribeUrl(email);
  return {
    html: `<p style="margin-top:32px;font-size:13px;color:#71717a">You're getting this because you subscribed at <a href="${site.url}" style="color:#0d9488">markstuart.dev</a>. <a href="${url}" style="color:#71717a">Unsubscribe</a> anytime.</p>`,
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

/** Send one new-post announcement to every subscriber. Returns count sent. */
export async function sendNewPostEmails(post: PostMeta, subscribers: string[]): Promise<number> {
  if (subscribers.length === 0) return 0;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const postUrl = `${site.url}/posts/${post.slug}`;
  // Individual sends, paced under Resend's rate limit. Gmail discarded a
  // same-second batch from this young domain; the single-send path delivers.
  let sent = 0;
  for (const email of subscribers) {
    const f = footer(email);
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `New post: ${post.title}`,
      headers: headers(email),
      text: `${post.title}\n\n${post.description}\n\nRead it: ${postUrl}${f.text}`,
      html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px"><h2 style="margin-bottom:4px">${post.title}</h2><p style="color:#52525b">${post.description}</p><p><a href="${postUrl}" style="color:#0d9488">Read it on markstuart.dev</a></p>${f.html}</div>`,
    });
    if (error) throw new Error(error.message);
    sent += 1;
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  return sent;
}
