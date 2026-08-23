import { NextResponse } from "next/server";
import { Resend } from "resend";
import { Webhook } from "svix";

// Receives Resend "email.received" webhooks for mark@markstuart.dev and
// forwards each message to the personal inbox. The forward preserves the
// original content verbatim (passthrough); FORWARD_TO stays server-side.
const FORWARD_TO = "stuartmark@gmail.com";
const FORWARD_FROM = "mark@markstuart.dev";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!secret || !apiKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: { type: string; data: { email_id?: string } };
  try {
    event = new Webhook(secret).verify(payload, headers) as typeof event;
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  if (event.type !== "email.received" || !event.data.email_id) {
    return NextResponse.json({ ignored: true });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.receiving.forward({
    emailId: event.data.email_id,
    to: FORWARD_TO,
    from: FORWARD_FROM,
    passthrough: true,
  });
  if (error) {
    // Non-2xx makes Resend retry the webhook, so transient failures self-heal.
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
  return NextResponse.json({ forwarded: true });
}
