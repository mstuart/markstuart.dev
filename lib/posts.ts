import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Post, PostMeta } from "@/lib/types";

// Resolved per call so tests can point at a fixture directory via
// MARKSTUART_POSTS_DIR without affecting production, which always reads the
// real content/posts under the current working directory.
function postsDir(): string {
  return process.env.MARKSTUART_POSTS_DIR ?? path.join(process.cwd(), "content", "posts");
}

export type PostFormat = "article" | "note";
export type WritingTheme =
  | "Developer platforms & SDKs"
  | "APIs & GraphQL"
  | "AI-enabled engineering"
  | "Web application security";

export interface WritingPostMeta extends PostMeta {
  format: PostFormat;
  theme: WritingTheme;
}

export interface WritingPost extends Post {
  format: PostFormat;
  theme: WritingTheme;
}

function readFormat(value: unknown): PostFormat {
  return value === "note" ? "note" : "article";
}

function readTheme(value: unknown): WritingTheme {
  if (
    value === "APIs & GraphQL" ||
    value === "AI-enabled engineering" ||
    value === "Developer platforms & SDKs" ||
    value === "Web application security"
  ) {
    return value;
  }
  return "Developer platforms & SDKs";
}

function readSlugs(): string[] {
  return fs
    .readdirSync(postsDir())
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export function getAllPosts(): WritingPostMeta[] {
  return readSlugs()
    .map((slug) => {
      const raw = fs.readFileSync(path.join(postsDir(), `${slug}.mdx`), "utf8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title as string,
        date: data.date as string,
        description: data.description as string,
        teaser: data.teaser as string | undefined,
        minutes: Math.max(1, Math.round(content.trim().split(/\s+/).length / 200)),
        sample: Boolean(data.sample),
        format: readFormat(data.format),
        theme: readTheme(data.theme),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): WritingPost | null {
  const filePath = path.join(postsDir(), `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    description: data.description as string,
    teaser: data.teaser as string | undefined,
    minutes: Math.max(1, Math.round(content.trim().split(/\s+/).length / 200)),
    sample: Boolean(data.sample),
    format: readFormat(data.format),
    theme: readTheme(data.theme),
    content,
  };
}
