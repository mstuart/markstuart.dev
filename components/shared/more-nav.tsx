"use client";

import { type KeyboardEvent, type ReactNode, useRef } from "react";
import { CaretDown } from "@phosphor-icons/react";

export function MoreNav({ children }: { children: ReactNode }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLDetailsElement>) {
    if (event.key !== "Escape" || !detailsRef.current?.open) return;

    event.preventDefault();
    detailsRef.current.open = false;
    summaryRef.current?.focus();
  }

  return (
    <details
      ref={detailsRef}
      className="group relative [&:has([aria-current])>summary]:text-accent"
      onKeyDown={handleKeyDown}
    >
      <summary
        ref={summaryRef}
        className="flex min-h-11 cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-md px-1 text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden"
      >
        More
        <CaretDown
          aria-hidden="true"
          className="transition-transform group-open:rotate-180"
          size={13}
          weight="regular"
        />
      </summary>
      <div className="absolute right-0 top-full z-50 mt-1 flex min-w-40 flex-col rounded-md border border-zinc-200 bg-zinc-50 p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        {children}
      </div>
    </details>
  );
}
