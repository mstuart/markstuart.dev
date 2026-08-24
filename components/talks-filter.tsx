"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";

export interface TalkListRow {
  title: string;
  /** Event or show name shown under the title. */
  context?: string;
  note?: string;
  date: string;
  url?: string;
  tag: string;
  /** Path to a small logo tile under /public. */
  iconSrc?: string;
}

const TAG_ORDER = ["Talks", "Appearances", "Community"];

function formatDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }
  if (/^\d{4}-\d{2}$/.test(date)) {
    return new Date(`${date}-01T00:00:00Z`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  }
  return date;
}

function pillClass(active: boolean) {
  return [
    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400",
    active
      ? "border-accent text-accent"
      : "border-zinc-200 text-muted hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600",
  ].join(" ");
}

export function TalksFilter({ rows }: { rows: TalkListRow[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.tag, (map.get(row.tag) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  const tags = useMemo(() => TAG_ORDER.filter((tag) => counts.has(tag)), [counts]);

  const visibleRows = activeTag ? rows.filter((row) => row.tag === activeTag) : rows;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={activeTag === null}
          onClick={() => setActiveTag(null)}
          className={pillClass(activeTag === null)}
        >
          All
          <span className="font-mono text-xs tabular-nums text-muted">{rows.length}</span>
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            aria-pressed={activeTag === tag}
            onClick={() => setActiveTag(tag)}
            className={pillClass(activeTag === tag)}
          >
            {tag}
            <span className="font-mono text-xs tabular-nums text-muted">{counts.get(tag)}</span>
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {visibleRows.length} results
      </p>
      <ul className="mt-6 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {visibleRows.map((row) => (
          <li key={`${row.title}-${row.date}`} className="flex gap-3 py-4">
            {row.iconSrc ? (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-zinc-100/10">
                <Image src={row.iconSrc} alt="" width={32} height={32} className="h-full w-full object-contain" />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                {row.url ? (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex min-w-0 items-center gap-1 rounded-md text-zinc-900 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-100 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
                  >
                    <span className="sm:truncate">{row.title}</span>
                    <ArrowUpRight size={14} weight="regular" className="shrink-0" />
                  </a>
                ) : (
                  <span className="text-zinc-900 sm:truncate dark:text-zinc-100">{row.title}</span>
                )}
                <time
                  dateTime={row.date}
                  className="shrink-0 font-mono text-xs tabular-nums text-muted"
                >
                  {formatDate(row.date)}
                </time>
              </div>
              {row.context ? <p className="mt-1 text-sm text-muted">{row.context}</p> : null}
              {row.note ? <p className="mt-1 text-xs text-muted">{row.note}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
