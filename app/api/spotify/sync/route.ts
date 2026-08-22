import { syncHistory } from "@/lib/listening-store";
import { isSpotifyConfigured } from "@/lib/spotify";

// Called hourly by Vercel Cron (see vercel.json). Idempotent: re-synced
// plays dedupe on their played-at timestamp.
export async function GET() {
  if (!isSpotifyConfigured()) {
    return Response.json({ configured: false, added: 0 });
  }
  try {
    const added = await syncHistory();
    return Response.json({ configured: true, added });
  } catch (error) {
    return Response.json({ configured: true, error: String(error) }, { status: 500 });
  }
}
