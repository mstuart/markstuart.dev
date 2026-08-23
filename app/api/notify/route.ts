import { getAllPosts } from "@/lib/posts";
import {
  getNotifiedSlugs,
  isSubscribeConfigured,
  listSubscribers,
  markNotified,
} from "@/lib/subscribers-store";
import { sendNewPostEmails } from "@/lib/mailer";

// Announces not-yet-notified posts to every subscriber. Runs daily via
// Vercel Cron (vercel.json); can also be triggered manually with the same
// bearer secret. Sample posts never notify.

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSubscribeConfigured()) {
    return Response.json({ configured: false, sent: 0 });
  }

  const notified = new Set(await getNotifiedSlugs());
  const fresh = getAllPosts().filter((p) => !p.sample && !notified.has(p.slug));
  if (fresh.length === 0) {
    return Response.json({ configured: true, newPosts: 0, sent: 0 });
  }

  const subscribers = await listSubscribers();
  let sent = 0;
  const announced: string[] = [];
  for (const post of fresh) {
    sent += await sendNewPostEmails(post, subscribers);
    await markNotified(post.slug);
    announced.push(post.slug);
  }
  return Response.json({ configured: true, newPosts: announced.length, announced, sent });
}
