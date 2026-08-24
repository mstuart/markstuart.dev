import { redisCommand, redisConfig, redisPipeline } from "@/lib/server/redis";
import { getRecentlyPlayed, type PlayedTrack } from "@/lib/spotify";

// Accumulating listening history. Spotify only exposes the last 50 plays, so
// the daily Vercel Cron appends new plays into this sorted set. Without Redis,
// the page falls back to Spotify's live last 50 without pagination.
const KEY = "listening:history";

export function isHistoryConfigured(): boolean {
  return redisConfig() !== null;
}

/** Append plays into history; returns how many were newly added. */
export async function syncHistory(): Promise<number> {
  const plays = await getRecentlyPlayed(50);
  if (plays.length === 0 || !isHistoryConfigured()) return 0;
  const commands = plays.map((play) => [
    "ZADD",
    KEY,
    "NX",
    String(new Date(play.playedAt).getTime()),
    JSON.stringify(play),
  ]);
  const results = await redisPipeline<number>(commands);
  return results.reduce((total, result) => total + (Number(result) || 0), 0);
}

export interface HistoryPage {
  items: PlayedTrack[];
  /** Pass as `before` to fetch the next (older) page; null when exhausted. */
  nextBefore: number | null;
}

export async function getHistory(before?: number, limit = 30): Promise<HistoryPage> {
  if (!isHistoryConfigured()) {
    const items = await getRecentlyPlayed(50);
    return { items: before ? [] : items, nextBefore: null };
  }
  const max = before ? `(${before}` : "+inf";
  const result = await redisCommand<string[]>([
    "ZRANGE",
    KEY,
    max,
    "-inf",
    "BYSCORE",
    "REV",
    "LIMIT",
    0,
    limit,
  ]);
  const items = (result ?? []).map((raw) => JSON.parse(raw) as PlayedTrack);
  const nextBefore =
    items.length === limit ? new Date(items[items.length - 1].playedAt).getTime() : null;
  return { items, nextBefore };
}
