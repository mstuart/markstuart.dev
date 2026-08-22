"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, MusicNotes, SpotifyLogo } from "@phosphor-icons/react";
import type { NowPlaying, PlayedTrack } from "@/lib/spotify";

interface HistoryResponse {
  configured: boolean;
  items: PlayedTrack[];
  nextBefore: number | null;
}

function formatPlayedAt(iso: string): string {
  const played = new Date(iso);
  const deltaMs = Date.now() - played.getTime();
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return played.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: played.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

function ArtTile({ src, size }: { src?: string; size: "sm" | "lg" }) {
  const classes =
    size === "lg"
      ? "h-16 w-16 rounded-lg"
      : "h-8 w-8 rounded-md";
  return (
    <span
      className={`${classes} flex shrink-0 items-center justify-center overflow-hidden bg-zinc-100 ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-zinc-100/10`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <MusicNotes size={size === "lg" ? 24 : 14} className="text-zinc-400 dark:text-zinc-500" />
      )}
    </span>
  );
}

function EqBars() {
  return (
    <span aria-hidden="true" className="inline-flex items-end gap-0.5 motion-reduce:hidden">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className="w-0.5 animate-pulse rounded-full bg-teal-600 dark:bg-teal-400"
          style={{ height: `${8 + bar * 3}px`, animationDelay: `${bar * 150}ms` }}
        />
      ))}
    </span>
  );
}

export function NowPlayingCard() {
  const [nowPlaying, setNowPlaying] = useState<(NowPlaying & { configured: boolean }) | null>(null);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const res = await fetch("/api/spotify/now-playing");
        if (res.ok && active) {
          setNowPlaying((await res.json()) as NowPlaying & { configured: boolean });
        }
      } catch {}
    }
    poll();
    const id = setInterval(poll, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!nowPlaying?.isPlaying || !nowPlaying.name) return null;
  return (
    <a
      href={nowPlaying.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-8 flex items-center gap-4 rounded-lg bg-zinc-100/70 p-4 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:bg-zinc-900/70 dark:hover:bg-zinc-900 dark:focus-visible:ring-teal-400"
    >
      <ArtTile src={nowPlaying.image} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-teal-600 dark:text-teal-400">
          <EqBars />
          Now playing
        </p>
        <p className="mt-1 truncate font-medium text-zinc-900 transition-colors group-hover:text-teal-600 dark:text-zinc-100 dark:group-hover:text-teal-400">
          {nowPlaying.name}
        </p>
        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{nowPlaying.artist}</p>
      </div>
      <SpotifyLogo size={20} className="shrink-0 text-zinc-400 dark:text-zinc-500" />
    </a>
  );
}

export function RecentlyPlayed() {
  const [pages, setPages] = useState<HistoryResponse[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadPage = useCallback(async (before?: number | null) => {
    const query = before ? `?before=${before}` : "";
    const res = await fetch(`/api/listening${query}`);
    if (!res.ok) return null;
    return (await res.json()) as HistoryResponse;
  }, []);

  useEffect(() => {
    loadPage().then((page) => {
      if (page) setPages([page]);
      setInitialLoaded(true);
    });
  }, [loadPage]);

  const items = pages.flatMap((page) => page.items);
  const configured = pages[0]?.configured ?? true;
  const nextBefore = pages.length > 0 ? pages[pages.length - 1].nextBefore : null;

  async function loadMore() {
    if (!nextBefore || loadingMore) return;
    setLoadingMore(true);
    const page = await loadPage(nextBefore);
    if (page) setPages((current) => [...current, page]);
    setLoadingMore(false);
  }

  return (
    <div>
      <div className="mt-10">
        <h2 className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Recently played</h2>
        {!initialLoaded ? (
          <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
        ) : !configured ? (
          <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">
            The Spotify connection is not configured yet.
          </p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">Nothing here yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map((item) => (
              <li key={`${item.playedAt}-${item.name}`}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-md px-2 py-2.5 -mx-2 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:hover:bg-zinc-900 dark:focus-visible:ring-teal-400"
                >
                  <ArtTile src={item.image} size="sm" />
                  <span className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 truncate text-sm text-zinc-900 transition-colors group-hover:text-teal-600 dark:text-zinc-100 dark:group-hover:text-teal-400">
                        <span className="truncate">{item.name}</span>
                        <ArrowUpRight size={12} weight="regular" className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                      <span className="block truncate text-sm text-zinc-500 dark:text-zinc-400">
                        {item.artist}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                      {formatPlayedAt(item.playedAt)}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
        {nextBefore ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-6 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 active:scale-[0.98] dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
