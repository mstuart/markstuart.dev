import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { SampleBadge } from "@/components/shared/sample-badge";
import { Code, Pre } from "@/components/mdx/code-block";
import { UpvoteButton } from "@/components/upvote-button";
import { blogPostingJsonLd, pageMetadata, serializeJsonLd } from "@/lib/metadata";
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

  const path = `/posts/${post.slug}`;
  const metadata = pageMetadata({
    title: post.title,
    description: post.description,
    path,
    type: "article",
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogPostingJsonLd(post)) }}
      />
      <Link
        href="/posts"
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
            className="mt-2 block font-mono text-xs text-muted"
          >
            {formatDate(post.date)}
          </time>
        </header>

        <div className="prose-quiet mt-8 font-serif text-[17px] leading-8 text-zinc-800 dark:text-zinc-200 [&_p]:mb-5 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold">
          <MDXRemote source={post.content} components={{ pre: Pre, code: Code }} />
        </div>

        <footer className="mt-10">
          <UpvoteButton slug={post.slug} />
        </footer>
      </article>
    </div>
  );
}
