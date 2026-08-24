"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, MusicNotes } from "@phosphor-icons/react";
import type { HistoryPage } from "@/lib/listening-store";
import type { SpotifyResult } from "@/lib/spotify";

function formatPlayedDuring(date: string): string {
  const played = new Date(`${date}T00:00:00.000Z`);
  const label = played.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: played.getUTCFullYear() === new Date().getUTCFullYear() ? undefined : "numeric",
    timeZone: "UTC",
  });
  return `Week of ${label}`;
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

export function NowPlayingCard() {
  return null;
}

export function RecentlyPlayed() {
  const [pages, setPages] = useState<HistoryPage[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginationError, setPaginationError] = useState(false);
  const [status, setStatus] = useState<"loading" | "ok" | "unavailable">("loading");
  const requestController = useRef<AbortController | null>(null);
  const requestVersion = useRef(0);

  const loadPage = useCallback(async (cursor?: number | null, signal?: AbortSignal) => {
    try {
      const query = cursor ? `?cursor=${cursor}` : "";
      const res = await fetch(`/api/listening${query}`, { signal });
      return (await res.json()) as SpotifyResult<HistoryPage>;
    } catch {
      return { status: "unavailable", reason: "history_unavailable" } as const;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;
    requestController.current?.abort();
    requestController.current = controller;
    void loadPage(null, controller.signal).then((result) => {
      if (controller.signal.aborted || version !== requestVersion.current) return;
      if (result.status === "ok") {
        setPages([result.data]);
        setStatus("ok");
      } else {
        setStatus("unavailable");
      }
    });
    return () => {
      requestVersion.current += 1;
      requestController.current?.abort();
      requestController.current = null;
    };
  }, [loadPage]);

  const items = pages.flatMap((page) => page.items);
  const nextCursor = pages.length > 0 ? pages[pages.length - 1].nextCursor : null;

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    const controller = new AbortController();
    const version = ++requestVersion.current;
    requestController.current?.abort();
    requestController.current = controller;
    setLoadingMore(true);
    setPaginationError(false);
    const result = await loadPage(nextCursor, controller.signal);
    if (controller.signal.aborted || version !== requestVersion.current) return;
    if (result.status === "ok") setPages((current) => [...current, result.data]);
    else setPaginationError(true);
    if (requestController.current === controller) requestController.current = null;
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
            {items.map((item, index) => (
              <li key={`${item.playedDuring}-${item.name}-${index}`}>
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
                      {formatPlayedDuring(item.playedDuring)}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
        {status === "ok" && paginationError ? (
          <p role="status" className="mt-4 text-sm text-muted">
            Could not load more listening history.
          </p>
        ) : null}
        {nextCursor ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-6 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-control-border px-3 py-1 text-sm text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
          >
            {loadingMore ? "Loading…" : paginationError ? "Retry" : "Load more"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
