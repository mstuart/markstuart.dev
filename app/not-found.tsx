import Link from "next/link";
import { PixelMonogram2 } from "@/components/px/monogram2";

const actionClass =
  "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-teal-400 dark:focus-visible:ring-offset-zinc-950";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center px-6 py-16">
      <section className="mx-auto w-full max-w-2xl" aria-labelledby="not-found-heading">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <PixelMonogram2 />
          <div className="min-w-0">
            <p className="font-mono text-xs tabular-nums text-muted">
              404 / route unavailable
            </p>
            <h1
              id="not-found-heading"
              className="mt-2 text-balance text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100"
            >
              Page not found
            </h1>
            <p className="mt-3 max-w-xl text-pretty leading-relaxed text-zinc-600 dark:text-zinc-400">
              The address may have changed, or the page may no longer be here. Start over or browse
              the project index.
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className={`${actionClass} bg-control text-control-foreground hover:bg-accent-hover`}
          >
            Home
          </Link>
          <Link
            href="/projects"
            className={`${actionClass} border border-zinc-300 text-zinc-700 hover:border-zinc-400 hover:text-teal-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-teal-300`}
          >
            Projects
          </Link>
        </div>
      </section>
    </main>
  );
}
