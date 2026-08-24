import { redisCommand, redisConfig, redisPipeline } from "@/lib/server/redis";
import { getRecentlyPlayed, type PlayedTrack, type SpotifyTrack } from "@/lib/spotify";

// Bounded listening history. Spotify only exposes the last 50 plays, so the
// daily Vercel Cron appends new plays and trims the oldest stored entries.
// Without Redis, the public feed falls back to those last 50 plays.
const KEY = "listening:history";
const RETAINED_HISTORY_LIMIT = 500;
const PUBLISHED_HISTORY_LIMIT = 90;
const MAX_PAGE_SIZE = 30;

export function isHistoryConfigured(): boolean {
  return redisConfig() !== null;
}

/** Append plays into history; returns how many were newly added. */
export async function syncHistory(): Promise<number> {
  if (!isHistoryConfigured()) return 0;
  const plays = await getRecentlyPlayed(50);
  if (plays.length === 0) return 0;
  const commands = [
    ...plays.map((play) => [
      "ZADD",
      KEY,
      "NX",
      String(new Date(play.playedAt).getTime()),
      JSON.stringify(play),
    ]),
    ["ZREMRANGEBYRANK", KEY, "0", String(-(RETAINED_HISTORY_LIMIT + 1))],
  ];
  const results = await redisPipeline<number>(commands);
  return results
    .slice(0, plays.length)
    .reduce((total, result) => total + (Number(result) || 0), 0);
}

export interface PublicPlayedTrack extends SpotifyTrack {
  /** UTC Monday for the play's week; exact playback time stays private. */
  playedDuring: string;
}

export interface HistoryPage {
  items: PublicPlayedTrack[];
  /** Offset cursor for the next bounded page; null when exhausted. */
  nextCursor: number | null;
}

function toPublicTrack({ playedAt, ...track }: PlayedTrack): PublicPlayedTrack {
  const played = new Date(playedAt);
  const daysSinceMonday = (played.getUTCDay() + 6) % 7;
  played.setUTCDate(played.getUTCDate() - daysSinceMonday);
  return { ...track, playedDuring: played.toISOString().slice(0, 10) };
}

export async function getHistory(cursor = 0, limit = MAX_PAGE_SIZE): Promise<HistoryPage> {
  const pageSize = Math.min(
    Math.max(1, Math.trunc(limit)),
    MAX_PAGE_SIZE,
    PUBLISHED_HISTORY_LIMIT - cursor
  );
  if (cursor < 0 || cursor >= PUBLISHED_HISTORY_LIMIT || pageSize <= 0) {
    return { items: [], nextCursor: null };
  }

  if (!isHistoryConfigured()) {
    const stored = await getRecentlyPlayed(50);
    const page = stored.slice(cursor, cursor + pageSize + 1);
    return {
      items: page.slice(0, pageSize).map(toPublicTrack),
      nextCursor:
        page.length > pageSize && cursor + pageSize < PUBLISHED_HISTORY_LIMIT
          ? cursor + pageSize
          : null,
    };
  }

  const result = await redisCommand<string[]>([
    "ZRANGE",
    KEY,
    cursor,
    cursor + pageSize,
    "REV",
  ]);
  const page = result ?? [];
  return {
    items: page
      .slice(0, pageSize)
      .map((raw) => toPublicTrack(JSON.parse(raw) as PlayedTrack)),
    nextCursor:
      page.length > pageSize && cursor + pageSize < PUBLISHED_HISTORY_LIMIT
        ? cursor + pageSize
        : null,
  };
}
