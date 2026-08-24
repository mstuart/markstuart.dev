import { getHistory, isHistoryConfigured, type HistoryPage } from "@/lib/listening-store";
import { publicError } from "@/lib/server/http";
import { logServerError } from "@/lib/server/log";
import { isSpotifyConfigured, type SpotifyResult } from "@/lib/spotify";

export async function GET(request: Request) {
  if (!isSpotifyConfigured()) {
    return Response.json(
      { status: "unavailable", reason: "not_configured" } satisfies SpotifyResult<HistoryPage>,
      { status: 503 }
    );
  }
  const params = new URL(request.url).searchParams;
  const beforeParam = params.get("before");
  const before = beforeParam ? Number(beforeParam) : undefined;
  if (beforeParam && !Number.isFinite(before)) {
    return publicError("invalid_cursor", 400, crypto.randomUUID());
  }
  const storedHistory = isHistoryConfigured();
  try {
    const page = await getHistory(before, 30);
    return Response.json({ status: "ok", data: page } satisfies SpotifyResult<HistoryPage>);
  } catch (error) {
    logServerError({
      correlationId: crypto.randomUUID(),
      operation: "listening.history",
      provider: storedHistory ? "redis" : "spotify",
      error,
    });
    return Response.json(
      {
        status: "unavailable",
        reason: storedHistory ? "history_unavailable" : "spotify_unavailable",
      } satisfies SpotifyResult<HistoryPage>,
      { status: 503 }
    );
  }
}
