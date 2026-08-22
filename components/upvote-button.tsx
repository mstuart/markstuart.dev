"use client";

import { useEffect, useState } from "react";
import { ArrowFatUp } from "@phosphor-icons/react";

export function UpvoteButton({ slug }: { slug: string }) {
  const [votes, setVotes] = useState<number | null>(null);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    setVoted(window.localStorage.getItem(`voted:${slug}`) === "1");
    fetch(`/api/votes?slug=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { votes: number } | null) => {
        if (data) setVotes(data.votes);
      })
      .catch(() => {});
  }, [slug]);

  async function upvote() {
    if (voted) return;
    setVoted(true);
    setVotes((current) => (current ?? 0) + 1);
    window.localStorage.setItem(`voted:${slug}`, "1");
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        const data = (await res.json()) as { votes: number };
        setVotes(data.votes);
      }
    } catch {
      // Keep the optimistic count; the vote just was not persisted.
    }
  }

  return (
    <button
      type="button"
      onClick={upvote}
      disabled={voted}
      aria-pressed={voted}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400",
        voted
          ? "border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400"
          : "cursor-pointer border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-teal-600 active:scale-[0.98] dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-teal-400",
      ].join(" ")}
    >
      <ArrowFatUp size={14} weight={voted ? "fill" : "regular"} />
      {voted ? "Upvoted" : "Upvote"}
      {votes !== null ? (
        <span className="font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-500">{votes}</span>
      ) : null}
    </button>
  );
}
