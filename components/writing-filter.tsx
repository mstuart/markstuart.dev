"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react";
import { WRITING_THEMES } from "@/lib/data/writing";
import type { PostFormat, WritingTheme } from "@/lib/posts";

export type WritingRow =
  | {
      kind: "local";
      slug: string;
      title: string;
      date: string;
      format: PostFormat;
      theme: WritingTheme;
      series?: string;
      iconSrc: string;
    }
  | {
      kind: "external";
      title: string;
      date: string;
      url: string;
      source: string;
      views?: number;
      theme: WritingTheme;
      iconSrc: string;
    };

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatViews(views: number): string {
  if (views >= 1000) {
    const thousands = views / 1000;
    const value = Number.isInteger(thousands) ? String(thousands) : thousands.toFixed(1);
    return `${value}K views`;
  }
  return `${views} views`;
}

function RowIcon({ src }: { src: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted ring-1 ring-line/20">
      <Image src={src} alt="" width={32} height={32} className="h-full w-full object-contain" />
    </span>
  );
}

function pillClass(active: boolean) {
  return [
    "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
    active
      ? "border-accent text-accent"
      : "border-line text-muted hover:border-control-border hover:text-foreground",
  ].join(" ");
}

function SelectedMark({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }

  return (
    <span aria-hidden="true" className="inline-flex w-3 justify-center font-medium">
      ✓
    </span>
  );
}

export function WritingRowContent({ row }: { row: WritingRow }) {
  return (
    <>
      <RowIcon src={row.iconSrc} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <span className="inline-flex min-w-0 items-center gap-1 text-foreground transition-colors group-hover:text-accent sm:truncate">
            <span className="sm:truncate">{row.title}</span>
            {row.kind === "external" ? (
              <ArrowUpRight aria-hidden="true" size={14} weight="regular" className="shrink-0" />
            ) : null}
          </span>
          <time dateTime={row.date} className="shrink-0 font-mono text-xs tabular-nums text-muted">
            {formatDate(row.date)}
          </time>
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
          <span className="font-mono text-xs tabular-nums">
            {row.kind === "local" ? (row.format === "note" ? "Note" : "Article") : row.source}
            {row.kind === "external" && row.views ? ` · ${formatViews(row.views)}` : ""}
          </span>
          {row.kind === "local" && row.series ? (
            <span className="max-w-full break-words rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide">
              Series: {row.series}
            </span>
          ) : null}
          <span className="rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide">
            {row.theme}
          </span>
        </span>
      </span>
    </>
  );
}

export function WritingFilter({ rows }: { rows: WritingRow[] }) {
  const [activeTheme, setActiveTheme] = useState<WritingTheme | null>(null);
  const counts = useMemo(() => {
    const result = new Map<WritingTheme, number>();
    for (const row of rows) {
      result.set(row.theme, (result.get(row.theme) ?? 0) + 1);
    }
    return result;
  }, [rows]);
  const themes = useMemo(
    () => WRITING_THEMES.filter((theme) => counts.has(theme)),
    [counts],
  );
  const visibleRows = activeTheme ? rows.filter((row) => row.theme === activeTheme) : rows;

  return (
    <div className="mt-10">
      <div role="group" aria-label="Filter writing by topic" className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-label={`All ${rows.length}`}
          aria-pressed={activeTheme === null}
          onClick={() => setActiveTheme(null)}
          className={pillClass(activeTheme === null)}
        >
          <SelectedMark active={activeTheme === null} />
          All
          <span className="font-mono text-xs tabular-nums text-muted">{rows.length}</span>
        </button>
        {themes.map((theme) => (
          <button
            key={theme}
            type="button"
            aria-label={`${theme} ${counts.get(theme) ?? 0}`}
            aria-pressed={activeTheme === theme}
            onClick={() => setActiveTheme(theme)}
            className={pillClass(activeTheme === theme)}
          >
            <SelectedMark active={activeTheme === theme} />
            {theme}
            <span className="font-mono text-xs tabular-nums text-muted">{counts.get(theme)}</span>
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {visibleRows.length} {visibleRows.length === 1 ? "result" : "results"}
      </p>
      <ul aria-label="Writing" className="mt-3 flex flex-col divide-y divide-line">
        {visibleRows.map((row) => (
          <li key={row.kind === "local" ? row.slug : row.url}>
            {row.kind === "local" ? (
              <Link
                href={`/posts/${row.slug}`}
                className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <WritingRowContent row={row} />
              </Link>
            ) : (
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <WritingRowContent row={row} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
