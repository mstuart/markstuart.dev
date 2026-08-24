"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, MusicNotes, SpotifyLogo } from "@phosphor-icons/react";
import type { HistoryPage } from "@/lib/listening-store";
import type { NowPlaying, SpotifyResult } from "@/lib/spotify";

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
  const pixels = size === "lg" ? 64 : 32;
  const classes =
    size === "lg"
      ? "h-16 w-16 rounded-lg"
      : "h-8 w-8 rounded-md";
  return (
    <span
      className={`${classes} flex shrink-0 items-center justify-center overflow-hidden bg-zinc-100 ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-zinc-100/10`}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={pixels}
          height={pixels}
          sizes={`${pixels}px`}
          loading={size === "lg" ? "eager" : "lazy"}
          className="h-full w-full object-cover"
        />
      ) : (
        <MusicNotes size={size === "lg" ? 24 : 14} className="text-muted" />
      )}
    </span>
  );
}

function EqBars() {
  return (
    <span data-equalizer aria-hidden="true" className="inline-flex items-end gap-0.5">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          data-bar
          className="w-0.5 rounded-full bg-teal-600 dark:bg-teal-400"
          style={{ height: `${8 + bar * 3}px` }}
        />
      ))}
    </span>
  );
}

export function NowPlayingCard() {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;
    let pollVersion = 0;
    let pollController: AbortController | null = null;

    function invalidatePoll() {
      pollVersion += 1;
      pollController?.abort();
      pollController = null;
    }

    async function poll() {
      if (document.hidden) return;
      const version = ++pollVersion;
      pollController?.abort();
      const controller = new AbortController();
      pollController = controller;
      try {
        const res = await fetch("/api/spotify/now-playing", { signal: controller.signal });
        const result = (await res.json()) as SpotifyResult<NowPlaying | null>;
        if (active && version === pollVersion && !controller.signal.aborted) {
          setNowPlaying(result.status === "ok" ? result.data : null);
        }
      } catch {
        if (active && version === pollVersion && !controller.signal.aborted) setNowPlaying(null);
      } finally {
        if (pollController === controller) pollController = null;
      }
    }
    function stop() {
      if (interval) clearInterval(interval);
      interval = null;
    }
    function syncPolling() {
      stop();
      invalidatePoll();
      if (document.hidden) return;
      void poll();
      interval = setInterval(poll, 60_000);
    }
    syncPolling();
    document.addEventListener("visibilitychange", syncPolling);
    return () => {
      active = false;
      stop();
      invalidatePoll();
      document.removeEventListener("visibilitychange", syncPolling);
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
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-accent">
          <EqBars />
          Now playing
        </p>
        <p className="mt-1 truncate font-medium text-zinc-900 transition-colors group-hover:text-teal-600 dark:text-zinc-100 dark:group-hover:text-teal-400">
          {nowPlaying.name}
        </p>
        <p className="truncate text-sm text-muted">{nowPlaying.artist}</p>
      </div>
      <SpotifyLogo size={20} className="shrink-0 text-muted" />
    </a>
  );
}

export function RecentlyPlayed() {
  const [pages, setPages] = useState<HistoryPage[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "ok" | "unavailable">("loading");

  const loadPage = useCallback(async (before?: number | null) => {
    try {
      const query = before ? `?before=${before}` : "";
      const res = await fetch(`/api/listening${query}`);
      return (await res.json()) as SpotifyResult<HistoryPage>;
    } catch {
      return { status: "unavailable", reason: "history_unavailable" } as const;
    }
  }, []);

  useEffect(() => {
    loadPage().then((result) => {
      if (result.status === "ok") {
        setPages([result.data]);
        setStatus("ok");
      } else {
        setStatus("unavailable");
      }
    });
  }, [loadPage]);

  const items = pages.flatMap((page) => page.items);
  const nextBefore = pages.length > 0 ? pages[pages.length - 1].nextBefore : null;

  async function loadMore() {
    if (!nextBefore || loadingMore) return;
    setLoadingMore(true);
    const result = await loadPage(nextBefore);
    if (result.status === "ok") setPages((current) => [...current, result.data]);
    else setStatus("unavailable");
    setLoadingMore(false);
  }

  return (
    <div>
      <div className="mt-10">
        <h2 className="text-sm font-medium text-muted">Recently played</h2>
        {status === "loading" ? (
          <p className="mt-4 text-sm text-muted">Loading…</p>
        ) : status === "unavailable" ? (
          <p className="mt-4 text-sm text-muted">
            Listening history is temporarily unavailable.
          </p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nothing here yet.</p>
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
                      <span className="block truncate text-sm text-muted">
                        {item.artist}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
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
            className="mt-6 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-control-border px-3 py-1 text-sm text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
