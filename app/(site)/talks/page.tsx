import { talks } from "@/lib/data/talks";
import { appearances } from "@/lib/data/appearances";
import { community } from "@/lib/data/community";
import { pageMetadata } from "@/lib/metadata";
import { TalksFilter, type TalkListRow } from "@/components/talks-filter";

export const metadata = pageMetadata({
  title: "Talks",
  description:
    "Talks, panels, and appearances — web security, GraphQL, and API platforms, from PayPal's early Node.js days through today.",
  path: "/talks",
});

export default function TalksPage() {
  const rows: TalkListRow[] = [
    ...talks.map((talk) => ({
      title: talk.title,
      context: talk.event,
      note: talk.note,
      date: talk.date,
      url: talk.url,
      tag: "Talks",
      iconSrc: talk.iconSrc,
    })),
    ...appearances.map((appearance) => ({
      title: appearance.title,
      context: appearance.show,
      note: appearance.description,
      date: appearance.date,
      url: appearance.url,
      tag: "Appearances",
      iconSrc: appearance.iconSrc,
    })),
    ...community.map((item) => ({
      title: item.event,
      note: item.note,
      date: item.date,
      url: item.url,
      tag: "Community",
      iconSrc: item.iconSrc,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-medium text-zinc-900 dark:text-zinc-100">Talks</h1>
      <p className="mt-2 text-sm text-muted">
        Talks, panels, and appearances — web security, GraphQL, and API platforms, from PayPal&apos;s early Node.js days through today.
      </p>
      <div className="mt-8">
        <TalksFilter rows={rows} />
      </div>
    </div>
  );
}
