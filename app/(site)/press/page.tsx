import type { Metadata } from "next";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { mentions } from "@/lib/data/mentions";
import type { Mention, MentionKind } from "@/lib/types";

export const metadata: Metadata = {
  title: "Press",
  description: "Newsletters, books, courses, and community coverage of my work.",
};

// Short labels for multi-URL mentions (e.g. the Hacker News threads), keyed
// by URL so mentions.ts doesn't need a data-model change for display text.
const THREAD_LABELS: Record<string, string> = {
  "https://news.ycombinator.com/item?id=21420027": "Scaling GraphQL at PayPal",
  "https://news.ycombinator.com/item?id=20627481": "GraphQL Resolvers: Best Practices",
  "https://news.ycombinator.com/item?id=18311741": "GraphQL: A Success Story for PayPal Checkout",
};

function compareByDateDesc(a: Mention, b: Mention): number {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

function formatDate(date: string): string {
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(date)) {
    return new Date(`${date.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  }
  return date;
}

// Ordered by impact: book interviews and citations lead, then direct quotes
// in industry publications, curriculum adoption, newsletter features, and
// broader community pickup.
const groups: Array<{ kind: MentionKind; heading: string }> = [
  { kind: "newsletter", heading: "Newsletters" },
  { kind: "community", heading: "Community" },
  { kind: "book", heading: "Books" },
  { kind: "press", heading: "Quotes" },
  { kind: "education", heading: "Teaching" },
];

function MentionRow({ mention }: { mention: Mention }) {
  return (
    <li className="py-4">
      <div className="flex gap-3">
        {mention.iconSrc ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-zinc-100/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mention.iconSrc} alt="" width={32} height={32} className="h-full w-full object-contain" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-4">
            <a
              href={mention.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-w-0 items-center gap-1 rounded-md text-zinc-900 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-100 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
            >
              <span className="truncate">{mention.title}</span>
              <ArrowUpRight size={14} weight="regular" className="shrink-0" />
            </a>
            {mention.date ? (
              <time
                dateTime={mention.date}
                className="shrink-0 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400"
              >
                {formatDate(mention.date)}
              </time>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{mention.description}</p>
          {mention.urls && mention.urls.length > 1 ? (
            <div className="mt-2 flex flex-wrap gap-4">
              {mention.urls.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-sm text-xs text-teal-600 transition-colors hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-teal-400 dark:hover:text-teal-300 dark:focus-visible:ring-teal-400"
                >
                  {THREAD_LABELS[url] ?? `Thread ${index + 1}`}
                  <ArrowUpRight size={12} weight="regular" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function PressPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-medium text-zinc-900 dark:text-zinc-100">Press</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Coverage, quotes, and places my work shows up.
      </p>

      {groups.map(({ kind, heading }) => {
        const items = mentions.filter((mention) => mention.kind === kind).sort(compareByDateDesc);
        if (items.length === 0) {
          return null;
        }
        return (
          <div key={kind} className="mt-10">
            <h2 className="text-sm font-medium text-zinc-400 dark:text-zinc-500">{heading}</h2>
            <ul className="mt-4 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((mention) => (
                <MentionRow key={mention.title} mention={mention} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
