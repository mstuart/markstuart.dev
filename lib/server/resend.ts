import { fetchWithTimeout } from "@/lib/server/http";

const RESEND_API_BASE = "https://api.resend.com";

export type ResendAttachment = {
  filename: string | null;
  content: string;
  content_type: string;
  content_id?: string;
};

export type ResendMessage = {
  from: string;
  to: string;
  reply_to?: string;
  subject: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  attachments?: ResendAttachment[];
};

export type ReceivedEmailMetadata = {
  subject?: string;
  raw?: { download_url?: string } | null;
};

type ResendSendOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

function resendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Mail is not configured");
  return apiKey;
}

function resendHeaders(idempotencyKey?: string): Headers {
  const headers = new Headers({
    authorization: `Bearer ${resendApiKey()}`,
    "content-type": "application/json",
  });
  if (idempotencyKey) headers.set("idempotency-key", idempotencyKey);
  return headers;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function getReceivedEmailMetadata(
  emailId: string,
  signal: AbortSignal,
): Promise<ReceivedEmailMetadata> {
  const response = await fetch(
    `${RESEND_API_BASE}/emails/receiving/${encodeURIComponent(emailId)}`,
    { method: "GET", headers: resendHeaders(), signal },
  );
  if (!response.ok) throw new Error("Inbound metadata request failed");
  return (await response.json()) as ReceivedEmailMetadata;
}

export async function sendResendEmail(
  message: ResendMessage,
  idempotencyKey: string,
  options: ResendSendOptions = {},
): Promise<void> {
  const request: RequestInit = {
    method: "POST",
    headers: resendHeaders(idempotencyKey),
    body: JSON.stringify(message),
    signal: options.signal,
  };
  const response = options.timeoutMs
    ? await fetchWithTimeout(`${RESEND_API_BASE}/emails`, request, options.timeoutMs)
    : await fetch(`${RESEND_API_BASE}/emails`, request);
  if (!response.ok) throw new Error("Mail provider rejected the request");
}
