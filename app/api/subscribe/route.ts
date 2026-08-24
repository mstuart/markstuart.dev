import { after } from "next/server";

import { processLifecycleMailJob } from "@/lib/mailer";
import { publicError } from "@/lib/server/http";
import { logServerError } from "@/lib/server/log";
import { rateLimit } from "@/lib/server/rate-limit";
import {
  getSubscriptionReadiness,
  isValidEmail,
  normalizeEmail,
  queueConfirmationDelivery,
} from "@/lib/subscribers-store";

function accepted(): Response {
  return Response.json(
    { ok: true, status: "check_email" },
    { status: 202, headers: { "X-Robots-Tag": "noindex" } },
  );
}

function clientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request): Promise<Response> {
  const correlationId = crypto.randomUUID();
  let email: unknown;
  try {
    const body = (await request.json()) as { email?: unknown };
    email = body.email;
  } catch {
    return publicError("invalid_email", 400, correlationId);
  }

  if (typeof email !== "string" || !isValidEmail(email)) {
    return publicError("invalid_email", 400, correlationId);
  }

  const normalized = normalizeEmail(email);
  try {
    if (!getSubscriptionReadiness("signup").ready) return accepted();

    const [emailLimit, clientLimit] = await Promise.all([
      rateLimit("subscribe-email", normalized, 3, 3600),
      rateLimit("subscribe-client", clientIdentifier(request), 10, 3600),
    ]);
    const jobId = await queueConfirmationDelivery(
      normalized,
      emailLimit.allowed && clientLimit.allowed,
    );
    after(async () => {
      if (!jobId) return;
      try {
        await processLifecycleMailJob("confirmation", jobId);
      } catch (error) {
        logServerError({
          correlationId: crypto.randomUUID(),
          operation: "subscription_confirmation",
          error,
        });
      }
    });
  } catch (error) {
    logServerError({
      correlationId,
      operation: "subscribe",
      provider: "redis",
      error,
    });
  }
  return accepted();
}
