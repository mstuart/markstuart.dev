import { publicError } from "@/lib/server/http";

export function requireCron(request: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") === `Bearer ${secret}`) {
    return null;
  }

  return publicError("unauthorized", 401, crypto.randomUUID());
}
