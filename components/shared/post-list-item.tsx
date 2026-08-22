import Link from "next/link";
import { SampleBadge } from "@/components/shared/sample-badge";
import type { PostMeta } from "@/lib/types";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PostListItem({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex items-baseline justify-between gap-4 rounded-md px-2 py-3 -mx-2 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:hover:bg-zinc-900 dark:focus-visible:ring-teal-400"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-zinc-900 transition-colors group-hover:text-teal-600 dark:text-zinc-100 dark:group-hover:text-teal-400">
          {post.title}
        </span>
        {post.sample ? <SampleBadge /> : null}
      </span>
      <time
        dateTime={post.date}
        className="shrink-0 font-mono text-xs text-zinc-500 dark:text-zinc-400"
      >
        {formatDate(post.date)}
      </time>
    </Link>
  );
}
