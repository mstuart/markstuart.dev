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
    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400",
    active
      ? "border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400"
      : "border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600",
  ].join(" ");
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
          aria-pressed={activeTag === null}
          onClick={() => setActiveTag(null)}
          className={pillClass(activeTag === null)}
        >
          All
          <span className="font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-500">{repos.length}</span>
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
            <span className="font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-500">{counts.get(tag)}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col">
        {visibleRepos.map((repo) => {
          const Icon = getProjectIcon(repo.icon);
          const rowContent = (
            <>
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="inline-flex shrink-0 items-baseline gap-1.5 text-sm text-zinc-700 transition-colors group-hover:text-teal-600 dark:text-zinc-300 dark:group-hover:text-teal-400">
                  <Icon size={14} weight="regular" className="shrink-0 self-center text-zinc-400 dark:text-zinc-500" />
                  {repo.name}
                </span>
                {repo.description ? (
                  <span className="truncate text-sm text-zinc-400 dark:text-zinc-500">{repo.description}</span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-baseline gap-2 font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
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
              className="group flex items-baseline justify-between gap-4 rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:hover:bg-zinc-900 dark:focus-visible:ring-teal-400"
            >
              {rowContent}
            </a>
          ) : (
            <div key={repo.name} className="flex items-baseline justify-between gap-4 rounded-md px-2 py-1.5 -mx-2">
              {rowContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
