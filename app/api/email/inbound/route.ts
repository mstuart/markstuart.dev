import { Buffer } from "node:buffer";

import PostalMime from "postal-mime";
import { Webhook } from "svix";

import { publicError } from "@/lib/server/http";
import { logServerError } from "@/lib/server/log";
import {
  getReceivedEmailMetadata,
  isResendConfigured,
  sendResendEmail,
  type ResendAttachment,
} from "@/lib/server/resend";
import {
  beginDeliveryAttempt,
  isInboundComplete,
  isValidEmail,
  markInboundComplete,
} from "@/lib/subscribers-store";

const FORWARD_FROM = "mark@markstuart.dev";
const FORWARD_TIMEOUT_MS = 8_000;
const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;
const MAX_RAW_MESSAGE_BYTES = 12 * 1024 * 1024;
const MAX_DECODED_MESSAGE_BYTES = 8 * 1024 * 1024;

class InboundPayloadTooLargeError extends Error {}

type InboundEvent = {
  type: string;
  data: { email_id?: string };
};

function requireBase64AttachmentContent(
  content: ArrayBuffer | Uint8Array | string,
): string {
  if (typeof content !== "string") {
    throw new Error("Inbound attachment encoding failed");
  }
  return content;
}

async function readBodyWithLimit(
  body: ReadableStream<Uint8Array> | null,
  contentLength: string | null,
  maxBytes: number,
): Promise<Uint8Array> {
  const declaredLength = contentLength === null ? Number.NaN : Number(contentLength);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new InboundPayloadTooLargeError();
  }
  if (!body) return new Uint8Array();

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new InboundPayloadTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

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

async function forwardInboundEmail(
  emailId: string,
  to: string,
  eventId: string,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  const metadata = await getReceivedEmailMetadata(emailId, signal);
  const rawDownloadUrl = metadata.raw?.download_url;
  if (!rawDownloadUrl) throw new Error("Inbound raw message is unavailable");
  const rawUrl = new URL(rawDownloadUrl);
  if (rawUrl.protocol !== "https:") throw new Error("Inbound raw message is unavailable");

  signal.throwIfAborted();
  const rawResponse = await fetch(rawUrl, { method: "GET", signal });
  if (!rawResponse.ok) throw new Error("Inbound raw message request failed");
  const rawMessage = await readBodyWithLimit(
    rawResponse.body,
    rawResponse.headers.get("content-length"),
    MAX_RAW_MESSAGE_BYTES,
  );

  signal.throwIfAborted();
  const parsed = await PostalMime.parse(rawMessage, { attachmentEncoding: "base64" });
  signal.throwIfAborted();
  // PostalMime exposes decoded bodies and attachments only after parsing. The raw
  // MIME input is bounded above; this second bound covers its decoded semantics.
  let decodedMessageBytes = Buffer.byteLength(parsed.text ?? "", "utf8");
  decodedMessageBytes += Buffer.byteLength(parsed.html ?? "", "utf8");
  for (const attachment of parsed.attachments) {
    decodedMessageBytes += Buffer.byteLength(
      requireBase64AttachmentContent(attachment.content),
      "base64",
    );
    if (decodedMessageBytes > MAX_DECODED_MESSAGE_BYTES) {
      throw new InboundPayloadTooLargeError();
    }
  }
  if (decodedMessageBytes > MAX_DECODED_MESSAGE_BYTES) {
    throw new InboundPayloadTooLargeError();
  }

  const attachments: ResendAttachment[] = parsed.attachments.map((attachment) => {
    const contentId = attachment.contentId?.replace(/^<|>$/gu, "");
    return {
      filename: attachment.filename,
      content: requireBase64AttachmentContent(attachment.content),
      content_type: attachment.mimeType,
      ...(contentId ? { content_id: contentId } : {}),
    };
  });

  await sendResendEmail(
    {
      from: FORWARD_FROM,
      to,
      subject: metadata.subject || "(no subject)",
      text: parsed.text || undefined,
      html: parsed.html || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    },
    `inbound/${eventId}`,
    { signal },
  );
}

export async function POST(request: Request): Promise<Response> {
  const correlationId = crypto.randomUUID();
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const forwardTo = process.env.INBOUND_FORWARD_TO;
  if (!secret || !isResendConfigured() || !forwardTo || !isValidEmail(forwardTo)) {
    return publicError("not_configured", 500, correlationId);
  }

  let payload: string;
  try {
    const payloadBytes = await readBodyWithLimit(
      request.body,
      request.headers.get("content-length"),
      MAX_WEBHOOK_BODY_BYTES,
    );
    payload = new TextDecoder().decode(payloadBytes);
  } catch (error) {
    if (error instanceof InboundPayloadTooLargeError) {
      return publicError("payload_too_large", 413, correlationId);
    }
    throw error;
  }
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
      forwardInboundEmail(inboundEmailId, forwardTo, eventId, signal),
    );

    await markInboundComplete(eventId);
    return Response.json({ forwarded: true });
  } catch (error) {
    if (error instanceof InboundPayloadTooLargeError) {
      return publicError("payload_too_large", 413, correlationId);
    }
    logServerError({
      correlationId,
      operation: "inbound_forward",
      error,
    });
    return publicError("forward_failed", 502, correlationId);
  }
}
