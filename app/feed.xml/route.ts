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
  category: string;
}

const EXTERNAL_DESCRIPTIONS: Record<string, string> = {
  "https://careers.rocket.com/blog/technology-and-product/ai-authored-static-analysis-code-enforcement":
    "How AI-authored static analysis can turn natural-language engineering rules into deterministic code enforcement.",
  "https://medium.com/paypal-tech/scaling-graphql-at-paypal-b5b5ac098810":
    "How PayPal scaled GraphQL across its API platform.",
  "https://medium.com/paypal-tech/graphql-instrumenting-your-api-and-unlocking-superpowers-c0bc3a9dc451":
    "A guide to instrumenting GraphQL APIs so teams can understand usage and performance.",
  "https://medium.com/paypal-tech/graphql-resolvers-best-practices-cd36fdbcef55":
    "Practical guidance for structuring GraphQL resolvers with predictable performance and maintainability.",
  "https://medium.com/paypal-tech/graphql-a-success-story-for-paypal-checkout-3482f724fb53":
    "How PayPal Checkout adopted GraphQL and built the platform around it.",
  "https://medium.com/paypal-engineering/securing-your-js-apps-w-stateless-csrf-9a60ee6bd010":
    "A practical approach to protecting JavaScript applications with stateless CSRF defenses.",
};

export function GET() {
  const localItems: FeedItem[] = getAllPosts().map((post) => ({
    title: post.title,
    link: `${site.url}/posts/${post.slug}`,
    date: post.date,
    description: post.teaser ?? post.description,
    category: "markstuart.dev",
  }));
  const externalItems: FeedItem[] = writing.map((entry) => {
    const description = EXTERNAL_DESCRIPTIONS[entry.url];
    if (!description) {
      throw new Error(`Missing authored RSS summary for ${entry.url}`);
    }

    return {
      title: entry.title,
      link: entry.url,
      date: entry.date,
      description,
      category: entry.source,
    };
  });
  const items = [...localItems, ...externalItems].sort((a, b) => (a.date < b.date ? 1 : -1));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <dc:creator>${escapeXml(site.name)}</dc:creator>
    <language>en-us</language>
    <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml" />
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
      <pubDate>${new Date(`${item.date.length === 10 ? item.date : `${item.date}-01`}T12:00:00Z`).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(site.name)}</dc:creator>
      <category>${escapeXml(item.category)}</category>
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
