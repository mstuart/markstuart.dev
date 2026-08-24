"use client";

import { useMemo, useState } from "react";
import { Star } from "@phosphor-icons/react";
import { getProjectIcon } from "@/lib/project-icons";
import { formatStarCount } from "@/lib/format";
import type { RepoIndexEntry } from "@/lib/data/all-projects";

const TAG_ORDER = [
  "AI & Agents",
  "GraphQL",
  "HTTP & APIs",
  "Async & Runtime",
  "Performance",
  "Data & Errors",
  "Other",
];

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
  return (
    <span aria-hidden="true" className="inline-flex w-3 justify-center font-medium">
      {active ? "✓" : null}
    </span>
  );
}

export function AllReposFilter({ repos }: { repos: RepoIndexEntry[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const present = new Set(repos.map((repo) => repo.tag));
    return TAG_ORDER.filter((tag) => present.has(tag));
  }, [repos]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const repo of repos) {
      map.set(repo.tag, (map.get(repo.tag) ?? 0) + 1);
    }
    return map;
  }, [repos]);

  const visibleRepos = activeTag ? repos.filter((repo) => repo.tag === activeTag) : repos;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-label={`All ${repos.length}`}
          aria-pressed={activeTag === null}
          onClick={() => setActiveTag(null)}
          className={pillClass(activeTag === null)}
        >
          <SelectedMark active={activeTag === null} />
          All
          <span className="font-mono text-xs tabular-nums text-muted">{repos.length}</span>
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            aria-label={`${tag} ${counts.get(tag) ?? 0}`}
            aria-pressed={activeTag === tag}
            onClick={() => setActiveTag(tag)}
            className={pillClass(activeTag === tag)}
          >
            <SelectedMark active={activeTag === tag} />
            {tag}
            <span className="font-mono text-xs tabular-nums text-muted">{counts.get(tag)}</span>
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {visibleRepos.length} {visibleRepos.length === 1 ? "result" : "results"}
      </p>
      <div className="mt-3 flex flex-col">
        {visibleRepos.map((repo) => {
          const Icon = getProjectIcon(repo.icon);
          const rowContent = (
            <>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                <span className="inline-flex min-w-0 items-baseline gap-1.5 break-words text-sm text-foreground transition-colors group-hover:text-accent">
                  <Icon size={14} weight="regular" className="shrink-0 self-center text-muted" />
                  {repo.name}
                </span>
                {repo.description ? (
                  <span className="text-sm leading-relaxed text-muted">{repo.description}</span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-baseline gap-2 font-mono text-xs tabular-nums text-muted">
                {formatStarCount(repo.stars) ? (
                  <span className="inline-flex items-center gap-1">
                    <Star size={12} weight="regular" />
                    {formatStarCount(repo.stars)}
                  </span>
                ) : null}
              </span>
            </>
          );
          return repo.url ? (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group -mx-2 flex items-start justify-between gap-4 rounded-md px-2 py-2 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {rowContent}
            </a>
          ) : (
            <div key={repo.name} className="-mx-2 flex items-start justify-between gap-4 rounded-md px-2 py-2">
              {rowContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
