"use client";

import { useState } from "react";
import { Rss } from "@phosphor-icons/react";

type State = "idle" | "loading" | "done" | "already" | "error";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok: boolean; added?: boolean };
      if (data.ok) {
        setState(data.added ? "done" : "already");
        setEmail("");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  const message =
    state === "done"
      ? "You're on the list. Talk soon."
      : state === "already"
        ? "You're already subscribed."
        : state === "error"
          ? "Something went wrong. Try again in a moment."
          : null;

  return (
    <div className="mt-6 rounded-lg bg-zinc-100/70 p-4 dark:bg-zinc-900/70">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Subscribe</p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Get an email when I publish something new. No other mail, unsubscribe anytime.
      </p>
      <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          aria-label="Email address"
          className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus-visible:ring-teal-400"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="cursor-pointer rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60 dark:focus-visible:ring-teal-400 dark:focus-visible:ring-offset-zinc-900"
        >
          {state === "loading" ? "…" : "Subscribe"}
        </button>
      </form>
      {message ? (
        <p
          className={`mt-2 text-sm ${state === "error" ? "text-amber-600 dark:text-amber-400" : "text-teal-600 dark:text-teal-400"}`}
        >
          {message}
        </p>
      ) : null}
      <a
        href="/feed.xml"
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
      >
        <Rss size={14} weight="regular" />
        Or subscribe by RSS
      </a>
    </div>
  );
}
