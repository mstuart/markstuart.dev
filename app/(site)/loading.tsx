export default function Loading() {
  return (
    <section
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-2xl px-6 py-16"
    >
      <span className="sr-only">Loading page</span>
      <div aria-hidden="true" className="space-y-8">
        <div className="space-y-3">
          <div
            data-skeleton
            className="h-3 w-20 rounded-sm bg-zinc-200/80 dark:bg-zinc-800"
          />
          <div data-skeleton className="h-8 w-52 max-w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div
            data-skeleton
            className="h-4 w-full max-w-xl rounded-sm bg-zinc-200/70 dark:bg-zinc-800/80"
          />
        </div>
        <div className="space-y-4">
          <div data-skeleton className="h-16 w-full rounded-md bg-zinc-200/60 dark:bg-zinc-900" />
          <div data-skeleton className="h-16 w-full rounded-md bg-zinc-200/60 dark:bg-zinc-900" />
          <div data-skeleton className="h-16 w-4/5 rounded-md bg-zinc-200/60 dark:bg-zinc-900" />
        </div>
      </div>
    </section>
  );
}
