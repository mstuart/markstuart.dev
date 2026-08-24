import { Buffer } from "node:buffer";

import PostalMime from "postal-mime";
import { Webhook } from "svix";

import { publicError } from "@/lib/server/http";
import { logServerError } from "@/lib/server/log";
import {
  beginDeliveryAttempt,
  isInboundComplete,
  isValidEmail,
  markInboundComplete,
} from "@/lib/subscribers-store";

const FORWARD_FROM = "mark@markstuart.dev";
const FORWARD_TIMEOUT_MS = 8_000;

type InboundEvent = {
  type: string;
  data: { email_id?: string };
};

type ReceivingMetadata = {
  subject?: string;
  raw?: { download_url?: string } | null;
};

type ForwardAttachment = {
  filename: string | null;
  content: string;
  content_type: string;
  content_id?: string;
};

async function withForwardTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);
  try {
    return await operation(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

function resendHeaders(apiKey: string): Headers {
  return new Headers({
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  });
}

async function forwardInboundEmail(
  emailId: string,
  to: string,
  apiKey: string,
  eventId: string,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  const metadataResponse = await fetch(
    `https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`,
    { method: "GET", headers: resendHeaders(apiKey), signal },
  );
  if (!metadataResponse.ok) throw new Error("Inbound metadata request failed");
  const metadata = (await metadataResponse.json()) as ReceivingMetadata;
  const rawDownloadUrl = metadata.raw?.download_url;
  if (!rawDownloadUrl) throw new Error("Inbound raw message is unavailable");
  const rawUrl = new URL(rawDownloadUrl);
  if (rawUrl.protocol !== "https:") throw new Error("Inbound raw message is unavailable");

  signal.throwIfAborted();
  const rawResponse = await fetch(rawUrl, { method: "GET", signal });
  if (!rawResponse.ok) throw new Error("Inbound raw message request failed");
  const rawMessage = await rawResponse.arrayBuffer();

  signal.throwIfAborted();
  const parsed = await PostalMime.parse(rawMessage, { attachmentEncoding: "base64" });
  signal.throwIfAborted();
  const attachments: ForwardAttachment[] = parsed.attachments.map((attachment) => {
    const content =
      typeof attachment.content === "string"
        ? attachment.content
        : Buffer.from(
            attachment.content instanceof ArrayBuffer
              ? new Uint8Array(attachment.content)
              : attachment.content,
          ).toString("base64");
    const contentId = attachment.contentId?.replace(/^<|>$/gu, "");
    return {
      filename: attachment.filename,
      content,
      content_type: attachment.mimeType,
      ...(contentId ? { content_id: contentId } : {}),
    };
  });

  const sendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: new Headers({
      ...Object.fromEntries(resendHeaders(apiKey)),
      "idempotency-key": `inbound/${eventId}`,
    }),
    body: JSON.stringify({
      from: FORWARD_FROM,
      to,
      subject: metadata.subject || "(no subject)",
      text: parsed.text || undefined,
      html: parsed.html || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    }),
    signal,
  });
  if (!sendResponse.ok) throw new Error("Inbound forwarding request failed");
}

export async function POST(request: Request): Promise<Response> {
  const correlationId = crypto.randomUUID();
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  const forwardTo = process.env.INBOUND_FORWARD_TO;
  if (!secret || !apiKey || !forwardTo || !isValidEmail(forwardTo)) {
    return publicError("not_configured", 500, correlationId);
  }

  const payload = await request.text();
  const eventId = request.headers.get("svix-id") ?? "";
  let event: InboundEvent;
  try {
    event = new Webhook(secret).verify(payload, {
      "svix-id": eventId,
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    }) as InboundEvent;
  } catch (error) {
    logServerError({
      correlationId,
      operation: "inbound_verify",
      provider: "svix",
      error,
    });
    return publicError("invalid_signature", 401, correlationId);
  }

  if (event.type !== "email.received" || !event.data.email_id) {
    return Response.json({ ignored: true });
  }
  const inboundEmailId = event.data.email_id;
  if (!eventId) return publicError("invalid_event", 400, correlationId);

  try {
    if (await isInboundComplete(eventId)) {
      return Response.json({ forwarded: true, duplicate: true });
    }

    const attempt = await beginDeliveryAttempt(`inbound:${eventId}`);
    if (attempt === "complete") {
      return Response.json({ forwarded: true, duplicate: true });
    }
    if (attempt === "ambiguous") {
      logServerError({
        correlationId,
        operation: "inbound_ambiguous",
        error: new Error("Mail delivery requires operator reconciliation"),
      });
      return publicError("forward_failed", 502, correlationId);
    }

    await withForwardTimeout((signal) =>
      forwardInboundEmail(inboundEmailId, forwardTo, apiKey, eventId, signal),
    );

    await markInboundComplete(eventId);
    return Response.json({ forwarded: true });
  } catch (error) {
    logServerError({
      correlationId,
      operation: "inbound_forward",
      error,
    });
    return publicError("forward_failed", 502, correlationId);
  }
}
