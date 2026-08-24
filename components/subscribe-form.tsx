"use client";

import { useState } from "react";
import { Rss } from "@phosphor-icons/react";

type State = "idle" | "loading" | "success" | "error";

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
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) {
        setState("success");
        setEmail("");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  const message =
    state === "success"
      ? "Check your email to confirm your subscription."
      : state === "error"
        ? "Something went wrong. Try again in a moment."
        : null;

  return (
    <div className="mt-6 rounded-lg bg-surface-muted/70 p-4">
      <p className="text-sm font-medium text-foreground">Subscribe</p>
      <p id="subscription-email-help" className="mt-1 text-sm text-muted">
        Get an email when I publish something new. I’ll send a link to confirm. No other mail, unsubscribe anytime.
      </p>
      <form onSubmit={submit} className="mt-3">
        <label htmlFor="subscription-email" className="block text-sm font-medium text-foreground">
          Email address
        </label>
        <div className="mt-1 flex flex-wrap gap-2">
          <input
            id="subscription-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (state === "success" || state === "error") setState("idle");
            }}
            required
            autoComplete="email"
            placeholder="you@example.com"
            aria-describedby="subscription-email-help"
            aria-invalid={state === "error"}
            className="min-h-11 min-w-0 flex-1 rounded-md border border-line bg-background px-3 py-1.5 text-base text-foreground placeholder:text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="min-h-11 cursor-pointer rounded-md bg-control px-3 py-1.5 text-sm font-medium text-control-foreground transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
          >
            {state === "loading" ? "…" : "Subscribe"}
          </button>
        </div>
      </form>
      {message ? (
        <p
          role={state === "error" ? "alert" : "status"}
          className={`mt-2 text-sm ${state === "error" ? "text-amber-600 dark:text-amber-400" : "text-accent"}`}
        >
          {message}
        </p>
      ) : null}
      <a
        href="/feed.xml"
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Rss size={14} weight="regular" />
        Or subscribe by RSS
      </a>
    </div>
  );
}
