import { getRecentlyPlayed, type PlayedTrack } from "@/lib/spotify";

// Accumulating listening history. Spotify only exposes the last 50 plays, so
// /api/spotify/sync (Vercel Cron, hourly) appends new plays into an Upstash
// Redis sorted set scored by played-at time. Without Redis configured the
// page falls back to the live last-50 straight from Spotify.

const KEY = "listening:history";

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function redisCommand(command: (string | number)[]): Promise<unknown> {
  const config = redisConfig();
  if (!config) throw new Error("redis not configured");
  const res = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command.map(String)),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis error ${res.status}`);
  const data = (await res.json()) as { result: unknown };
  return data.result;
}

export function isHistoryConfigured(): boolean {
  return redisConfig() !== null;
}

/** Append plays into history; returns how many were newly added. */
export async function syncHistory(): Promise<number> {
  const plays = await getRecentlyPlayed(50);
  if (plays.length === 0 || !isHistoryConfigured()) return 0;
  let added = 0;
  for (const play of plays) {
    const score = new Date(play.playedAt).getTime();
    // NX: a re-synced play at the same timestamp is left untouched.
    const result = await redisCommand(["ZADD", KEY, "NX", score, JSON.stringify(play)]);
    added += Number(result) || 0;
  }
  return added;
}

export interface HistoryPage {
  items: PlayedTrack[];
  /** Pass as `before` to fetch the next (older) page; null when exhausted. */
  nextBefore: number | null;
}

export async function getHistory(before?: number, limit = 30): Promise<HistoryPage> {
  if (!isHistoryConfigured()) {
    // Live fallback: last 50 from Spotify, no pagination.
    const items = await getRecentlyPlayed(50);
    return { items: before ? [] : items, nextBefore: null };
  }
  const max = before ? `(${before}` : "+inf";
  const result = (await redisCommand([
    "ZRANGE", KEY, max, "-inf", "BYSCORE", "REV", "LIMIT", 0, limit,
  ])) as string[];
  const items = (result ?? []).map((raw) => JSON.parse(raw) as PlayedTrack);
  const nextBefore =
    items.length === limit ? new Date(items[items.length - 1].playedAt).getTime() : null;
  return { items, nextBefore };
}
