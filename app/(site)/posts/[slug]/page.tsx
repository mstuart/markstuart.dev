import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { SampleBadge } from "@/components/shared/sample-badge";
import { Code, Pre } from "@/components/mdx/code-block";
import { UpvoteButton } from "@/components/upvote-button";
import { getAllPosts, getPost } from "@/lib/posts";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/posts/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPost(slug);

  if (!post) {
    return {};
  }

  const url = `https://markstuart.dev/posts/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      publishedTime: post.date,
    },
  };
}

export default async function PostPage(props: PageProps<"/posts/[slug]">) {
  const { slug } = await props.params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/posts"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-md dark:text-zinc-400 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
      >
        <ArrowLeft size={14} weight="regular" />
        Posts
      </Link>

      <article className="mt-8">
        <header>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium text-zinc-900 dark:text-zinc-100">{post.title}</h1>
            {post.sample ? <SampleBadge /> : null}
          </div>
          <time
            dateTime={post.date}
            className="mt-2 block font-mono text-xs text-zinc-500 dark:text-zinc-400"
          >
            {formatDate(post.date)}
          </time>
        </header>

        <div className="prose-quiet mt-8 font-serif text-[17px] leading-8 text-zinc-800 dark:text-zinc-200 [&_p]:mb-5 [&_a]:text-teal-600 [&_a]:underline [&_a]:underline-offset-4 dark:[&_a]:text-teal-400 [&_strong]:font-semibold">
          <MDXRemote source={post.content} components={{ pre: Pre, code: Code }} />
        </div>

        <footer className="mt-10">
          <UpvoteButton slug={post.slug} />
        </footer>
      </article>
    </div>
  );
}
