import { ArrowUpRight, NewspaperClipping } from "@phosphor-icons/react/dist/ssr";
import { manuscripts, mentions } from "@/lib/data/mentions";
import { pageMetadata } from "@/lib/metadata";
import type { Mention, MentionKind } from "@/lib/types";

export const metadata = pageMetadata({
  title: "Press",
  description: "Newsletters, books, courses, and community coverage of my work.",
  path: "/press",
});

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

// Ordered by the kind of evidence each group provides: direct quotes first,
// followed by published books, teaching material, newsletters, and community
// references. In-progress manuscripts are kept separate from published books.
const groups: Array<{ kind: MentionKind; heading: string }> = [
  { kind: "press", heading: "Quotes" },
  { kind: "book", heading: "Books" },
  { kind: "education", heading: "Teaching" },
  { kind: "newsletter", heading: "Newsletters" },
  { kind: "community", heading: "Community" },
];

function MentionRow({ mention }: { mention: Mention }) {
  return (
    <li className="py-4">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted ring-1 ring-line">
          <NewspaperClipping aria-hidden="true" size={16} weight="regular" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <a
              href={mention.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-w-0 items-start gap-1 rounded-md text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="break-words">{mention.title}</span>
              <ArrowUpRight size={14} weight="regular" className="mt-1 shrink-0" />
            </a>
            {mention.date ? (
              <time
                dateTime={mention.date}
                className="shrink-0 font-mono text-xs tabular-nums text-muted"
              >
                {formatDate(mention.date)}
              </time>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{mention.description}</p>
          {mention.urls && mention.urls.length > 1 ? (
            <div className="mt-2 flex flex-wrap gap-4">
              {mention.urls.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 rounded-sm text-xs text-accent transition-colors hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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

function MentionSection({ heading, items }: { heading: string; items: Mention[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium text-muted">{heading}</h2>
      <ul className="mt-4 flex flex-col divide-y divide-line">
        {[...items].sort(compareByDateDesc).map((mention) => (
          <MentionRow key={mention.title} mention={mention} />
        ))}
      </ul>
    </section>
  );
}

export default function PressPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-medium text-foreground">Press</h1>
      <p className="mt-2 text-sm text-muted">
        Coverage, quotes, and places my work shows up.
      </p>

      {groups.map(({ kind, heading }) => {
        const items = mentions.filter((mention) => mention.kind === kind);
        return (
          <div key={kind}>
            <MentionSection heading={heading} items={items} />
            {kind === "book" ? <MentionSection heading="Manuscripts" items={manuscripts} /> : null}
          </div>
        );
      })}
    </div>
  );
}
