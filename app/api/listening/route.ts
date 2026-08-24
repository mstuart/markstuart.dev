import { getHistory, isHistoryConfigured, type HistoryPage } from "@/lib/listening-store";
import { publicError } from "@/lib/server/http";
import { logServerError } from "@/lib/server/log";
import { isSpotifyConfigured, type SpotifyResult } from "@/lib/spotify";

const PAGE_SIZE = 30;
const PUBLISHED_HISTORY_LIMIT = 90;
const FALLBACK_HISTORY_LIMIT = 50;
const PUBLIC_CACHE = "public, max-age=300, s-maxage=300, stale-while-revalidate=600";

export async function GET(request: Request) {
  if (!isSpotifyConfigured()) {
    return Response.json(
      { status: "unavailable", reason: "not_configured" } satisfies SpotifyResult<HistoryPage>,
      { status: 503 }
    );
  }
  const url = new URL(request.url);
  const params = url.searchParams;
  const cursorParam = params.get("cursor");
  const cursor = cursorParam === null ? 0 : Number(cursorParam);
  const storedHistory = isHistoryConfigured();
  const cursorLimit = storedHistory ? PUBLISHED_HISTORY_LIMIT : FALLBACK_HISTORY_LIMIT;
  const canonicalSearch = cursor === 0 ? "" : `?cursor=${cursor}`;
  if (
    url.search !== canonicalSearch ||
    !Number.isSafeInteger(cursor) ||
    cursor < 0 ||
    cursor >= cursorLimit ||
    cursor % PAGE_SIZE !== 0
  ) {
    return publicError("invalid_cursor", 400, crypto.randomUUID());
  }
  try {
    const page = await getHistory(cursor, PAGE_SIZE);
    return Response.json(
      { status: "ok", data: page } satisfies SpotifyResult<HistoryPage>,
      { headers: { "Cache-Control": PUBLIC_CACHE } }
    );
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
