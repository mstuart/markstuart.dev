import { getAllPosts } from "@/lib/posts";
import { SubscribeForm } from "@/components/subscribe-form";
import { WritingFilter, type WritingRow } from "@/components/writing-filter";
import { WRITING_THEMES, writing } from "@/lib/data/writing";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Writing",
  description: "Blog posts written here and elsewhere, read more than 410K times.",
  path: "/posts",
});

const SOURCE_ICONS: Record<string, string> = {
  "PayPal Technology Blog": "/work/paypal.png",
  "Rocket Technology Blog": "/work/rocket.png",
};

export default function PostsPage() {
  const localRows: WritingRow[] = getAllPosts().map((post) => ({
    kind: "local",
    slug: post.slug,
    title: post.title,
    date: post.date,
    format: post.format,
    theme: post.theme,
    iconSrc: "/icon.svg",
  }));
  const externalRows: WritingRow[] = writing.map((entry) => ({
    kind: "external",
    title: entry.title,
    date: entry.date,
    url: entry.url,
    source: entry.source,
    views: entry.views,
    theme: entry.theme ?? WRITING_THEMES[0],
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
      <WritingFilter rows={rows} />
    </div>
  );
}
