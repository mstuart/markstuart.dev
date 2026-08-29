import type { Metadata } from "next";
import { site } from "@/lib/data/site";
import type { PostMeta } from "@/lib/types";

const DEFAULT_SOCIAL_IMAGE = "/opengraph-image";

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
}

export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  image = DEFAULT_SOCIAL_IMAGE,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
      types: { "application/rss+xml": "/feed.xml" },
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: site.name,
      locale: "en_US",
      type,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  jobTitle: site.role,
  description: site.description,
  sameAs: site.social.map((link) => link.href),
};

export function blogPostingJsonLd(post: PostMeta, image?: string) {
  const url = `${site.url}/posts/${post.slug}`;
  const imageUrl = image
    ? new URL(image, site.url).toString()
    : `${site.url}${DEFAULT_SOCIAL_IMAGE}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url,
    mainEntityOfPage: url,
    image: imageUrl,
    author: {
      "@type": "Person",
      name: site.name,
      url: site.url,
    },
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
