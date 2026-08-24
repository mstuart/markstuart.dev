"use client";

import Link from "next/link";

interface SiteErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

const actionClass =
  "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-teal-400 dark:focus-visible:ring-offset-zinc-950";

export default function SiteError({ retry }: SiteErrorProps) {
  return (
    <section
      className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center px-6 py-16"
      aria-labelledby="route-error-heading"
    >
      <div>
        <p className="font-mono text-xs tabular-nums text-muted">
          500 / route interrupted
        </p>
        <h1
          id="route-error-heading"
          className="mt-2 text-balance text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          This page hit a snag
        </h1>
        <p className="mt-3 max-w-xl text-pretty leading-relaxed text-zinc-600 dark:text-zinc-400">
          The interruption may be temporary. Try loading this route again, or return to the home
          page.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={retry}
            className={`${actionClass} cursor-pointer border-0 bg-control text-control-foreground hover:bg-accent-hover`}
          >
            Try again
          </button>
          <Link
            href="/"
            className={`${actionClass} border border-zinc-300 text-zinc-700 hover:border-zinc-400 hover:text-teal-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-teal-300`}
          >
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
