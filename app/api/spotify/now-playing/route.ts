import { logServerError } from "@/lib/server/log";
import {
  getNowPlaying,
  isSpotifyConfigured,
  type NowPlaying,
  type SpotifyResult,
} from "@/lib/spotify";

export async function GET() {
  if (!isSpotifyConfigured()) {
    return Response.json(
      { status: "unavailable", reason: "not_configured" } satisfies SpotifyResult<NowPlaying | null>,
      { status: 503 }
    );
  }
  try {
    const nowPlaying = await getNowPlaying();
    return Response.json({ status: "ok", data: nowPlaying } satisfies SpotifyResult<NowPlaying | null>);
  } catch (error) {
    logServerError({
      correlationId: crypto.randomUUID(),
      operation: "spotify.now_playing",
      provider: "spotify",
      error,
    });
    return Response.json(
      {
        status: "unavailable",
        reason: "spotify_unavailable",
      } satisfies SpotifyResult<NowPlaying | null>,
      { status: 503 }
    );
  }
}
