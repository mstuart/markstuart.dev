import { syncHistory } from "@/lib/listening-store";
import { requireCron } from "@/lib/server/auth";
import { publicError } from "@/lib/server/http";
import { logServerError } from "@/lib/server/log";
import { isSpotifyConfigured } from "@/lib/spotify";

// Called hourly by Vercel Cron (see vercel.json). Idempotent: re-synced
// plays dedupe on their played-at timestamp.
export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  if (!isSpotifyConfigured()) {
    return Response.json({ configured: false, added: 0 });
  }
  try {
    const added = await syncHistory();
    return Response.json({ configured: true, added });
  } catch (error) {
    const correlationId = crypto.randomUUID();
    logServerError({ correlationId, operation: "spotify_sync", provider: "spotify", error });
    return publicError("sync_failed", 500, correlationId);
  }
}
