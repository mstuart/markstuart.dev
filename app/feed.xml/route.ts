import { getAllPosts } from "@/lib/posts";
import { writing } from "@/lib/data/writing";
import { site } from "@/lib/data/site";

export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

interface FeedItem {
  title: string;
  link: string;
  date: string;
  description: string;
}

export function GET() {
  const localItems: FeedItem[] = getAllPosts().map((post) => ({
    title: post.title,
    link: `${site.url}/posts/${post.slug}`,
    date: post.date,
    description: post.description,
  }));
  const externalItems: FeedItem[] = writing.map((entry) => ({
    title: entry.title,
    link: entry.url,
    date: entry.date,
    description: `Published on the ${entry.source}.`,
  }));
  const items = [...localItems, ...externalItems].sort((a, b) => (a.date < b.date ? 1 : -1));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <language>en-us</language>
    <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml" />
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
      <pubDate>${new Date(`${item.date.length === 10 ? item.date : `${item.date}-01`}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
