"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowFatUp } from "@phosphor-icons/react";

export function UpvoteButton({ slug }: { slug: string }) {
  const [votes, setVotes] = useState<number | null>(null);
  const [voted, setVoted] = useState(false);
  const requestVersion = useRef(0);
  const initialRequestAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;
    initialRequestAbort.current = controller;

    fetch(`/api/votes?slug=${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { votes: number; voted: boolean } | null) => {
        if (data && version === requestVersion.current) {
          setVotes(data.votes);
          setVoted(data.voted);
        }
      })
      .catch(() => {});

    return () => {
      controller.abort();
      if (initialRequestAbort.current === controller) initialRequestAbort.current = null;
    };
  }, [slug]);

  async function upvote() {
    if (voted) return;
    const mutationVersion = ++requestVersion.current;
    initialRequestAbort.current?.abort();
    initialRequestAbort.current = null;
    const previousVotes = votes;
    const previousVoted = voted;
    setVoted(true);
    setVotes((current) => (current ?? 0) + 1);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) throw new Error("Vote request failed");
      const data = (await res.json()) as { votes: number; voted: boolean };
      if (mutationVersion !== requestVersion.current) return;
      setVotes(data.votes);
      setVoted(data.voted);
    } catch {
      if (mutationVersion !== requestVersion.current) return;
      setVotes(previousVotes);
      setVoted(previousVoted);
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
          ? "border-accent text-accent"
          : "cursor-pointer border-zinc-200 text-muted hover:border-zinc-400 hover:text-accent active:scale-[0.98] dark:border-zinc-800 dark:hover:border-zinc-600",
      ].join(" ")}
    >
      <ArrowFatUp size={14} weight={voted ? "fill" : "regular"} />
      {voted ? "Upvoted" : "Upvote"}
      {votes !== null ? (
        <span className="font-mono text-xs tabular-nums text-muted">{votes}</span>
      ) : null}
    </button>
  );
}
