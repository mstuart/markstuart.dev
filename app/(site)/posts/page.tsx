import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getAllPosts } from "@/lib/posts";
import { SubscribeForm } from "@/components/subscribe-form";
import { writing } from "@/lib/data/writing";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Writing",
  description: "Blog posts written here and elsewhere, read more than 410K times.",
  path: "/posts",
});

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatViews(views: number): string {
  if (views >= 1000) {
    const thousands = views / 1000;
    const value = Number.isInteger(thousands) ? String(thousands) : thousands.toFixed(1);
    return `${value}K views`;
  }
  return `${views} views`;
}

type WritingRow =
  | { kind: "local"; slug: string; title: string; date: string; iconSrc: string }
  | { kind: "external"; title: string; date: string; url: string; source: string; views?: number; iconSrc: string };

const SOURCE_ICONS: Record<string, string> = {
  "PayPal Technology Blog": "/writing/paypal.png",
  "Rocket Technology Blog": "/writing/rocket.png",
};

function RowIcon({ src }: { src: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-zinc-100/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={32} height={32} className="h-full w-full object-contain" />
    </span>
  );
}

export default function PostsPage() {
  const localRows: WritingRow[] = getAllPosts().map((post) => ({
    kind: "local",
    slug: post.slug,
    title: post.title,
    date: post.date,
    iconSrc: "/icon.svg",
  }));
  const externalRows: WritingRow[] = writing.map((entry) => ({
    kind: "external",
    title: entry.title,
    date: entry.date,
    url: entry.url,
    source: entry.source,
    views: entry.views,
    iconSrc: SOURCE_ICONS[entry.source],
  }));
  const rows = [...localRows, ...externalRows].sort((a, b) => (a.date < b.date ? 1 : -1));
  // Sum of per-post Medium view counts, rounded down to a clean figure so the
  // claim never overstates (417.3K total as of the 2026-08-20 stats snapshot).
  const totalViews = writing.reduce((sum, entry) => sum + (entry.views ?? 0), 0);
  const roundedViews = Math.floor(totalViews / 10000) * 10000;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-medium text-zinc-900 dark:text-zinc-100">Writing</h1>
      <p className="mt-2 text-sm text-muted">
        Blog posts written here and elsewhere, read more than{" "}
        {(roundedViews / 1000).toLocaleString("en-US")}K times.
      </p>
      <SubscribeForm />
      <div className="mt-10 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {rows.map((row) =>
          row.kind === "local" ? (
            <Link
              key={row.slug}
              href={`/posts/${row.slug}`}
              className="group flex items-center gap-3 rounded-md px-2 py-3 -mx-2 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:hover:bg-zinc-900 dark:focus-visible:ring-teal-400"
            >
              <RowIcon src={row.iconSrc} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <span className="text-zinc-900 transition-colors group-hover:text-teal-600 sm:truncate dark:text-zinc-100 dark:group-hover:text-teal-400">
                  {row.title}
                </span>
                <time
                  dateTime={row.date}
                  className="shrink-0 font-mono text-xs tabular-nums text-muted"
                >
                  {formatDate(row.date)}
                </time>
              </span>
            </Link>
          ) : (
            <a
              key={row.url}
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-3 rounded-md px-2 py-3 -mx-2 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:hover:bg-zinc-900 dark:focus-visible:ring-teal-400"
            >
              <RowIcon src={row.iconSrc} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <span className="inline-flex min-w-0 items-center gap-1 text-zinc-900 transition-colors group-hover:text-teal-600 sm:truncate dark:text-zinc-100 dark:group-hover:text-teal-400">
                    <span className="sm:truncate">{row.title}</span>
                    <ArrowUpRight size={14} weight="regular" className="shrink-0" />
                  </span>
                  <time
                    dateTime={row.date}
                    className="shrink-0 font-mono text-xs tabular-nums text-muted"
                  >
                    {formatDate(row.date)}
                  </time>
                </span>
                <span className="font-mono text-xs tabular-nums text-muted">
                  {row.source}
                  {row.views ? ` · ${formatViews(row.views)}` : ""}
                </span>
              </span>
            </a>
          )
        )}
      </div>
    </div>
  );
}
