import type { Metadata } from "next";
import { describe, expect, it, vi } from "vitest";
import { generateMetadata as generatePostMetadata } from "@/app/(site)/posts/[slug]/page";
import type { PostMeta } from "@/lib/types";

interface MetadataHelpers {
  pageMetadata: (input: {
    title: string;
    description: string;
    path: string;
    type?: "website" | "article";
    image?: string;
  }) => Metadata;
  personJsonLd: unknown;
  blogPostingJsonLd: (post: PostMeta) => unknown;
  serializeJsonLd: (value: unknown) => string;
}

async function loadModule<T>(id: string): Promise<T | null> {
  try {
    return await vi.importActual<T>(id);
  } catch {
    return null;
  }
}

describe("route metadata", () => {
  it("creates route-specific canonical and social URLs", async () => {
    const helpers = await loadModule<MetadataHelpers>("@/lib/metadata");

    expect(helpers).not.toBeNull();
    if (!helpers) return;

    const value = helpers.pageMetadata({
      title: "Work",
      description: "Career",
      path: "/work",
    });

    expect(value.alternates).toMatchObject({
      canonical: "/work",
      types: { "application/rss+xml": "/feed.xml" },
    });
    expect(value.openGraph).toMatchObject({
      title: "Work",
      description: "Career",
      url: "/work",
      type: "website",
      images: ["/opengraph-image"],
    });
    expect(value.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Work",
      description: "Career",
      images: ["/opengraph-image"],
    });
  });

  it("applies canonical and social metadata to every route owned by this task", async () => {
    const routes = [
      ["@/app/(site)/page", "/"],
      ["@/app/(site)/posts/page", "/posts"],
      ["@/app/(site)/work/page", "/work"],
      ["@/app/(site)/stack/page", "/stack"],
      ["@/app/(site)/talks/page", "/talks"],
    ] as const;

    for (const [moduleId, path] of routes) {
      const route = await loadModule<{ metadata?: Metadata }>(moduleId);
      expect(route, moduleId).not.toBeNull();
      expect(route?.metadata?.alternates?.canonical, moduleId).toBe(path);
      expect(route?.metadata?.openGraph, moduleId).toMatchObject({ url: path });
      expect(route?.metadata?.twitter, moduleId).toMatchObject({ card: "summary_large_image" });
    }
  });

  it("does not generate article metadata for an unpublished post", async () => {
    const value = await generatePostMetadata({
      params: Promise.resolve({ slug: "coding-agent-infrastructure" }),
    } as PageProps<"/posts/[slug]">);

    expect(value).toEqual({});
  });

  it("limits post routes to published slugs", async () => {
    const route = await loadModule<{ dynamicParams?: boolean }>("@/app/(site)/posts/[slug]/page");

    expect(route?.dynamicParams).toBe(false);
  });
});

describe("structured data", () => {
  it("builds person data only from the public site identity", async () => {
    const helpers = await loadModule<MetadataHelpers>("@/lib/metadata");

    expect(helpers).not.toBeNull();
    expect(helpers?.personJsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Mark Stuart",
      url: "https://markstuart.dev",
      jobTitle: "Distinguished Engineer",
      description:
        "Mark Stuart, Distinguished Engineer at Rocket. Nearly two decades of platform engineering at PayPal, eBay, and Rocket — open source, talks, and occasional writing on GraphQL, API platforms, and AI tooling.",
      sameAs: [
        "https://github.com/mstuart",
        "https://www.linkedin.com/in/markastuart/",
        "https://x.com/markstuartdev",
      ],
    });
  });

  it("builds article data from public post and site fields", async () => {
    const helpers = await loadModule<MetadataHelpers>("@/lib/metadata");
    const post: PostMeta = {
      slug: "sample",
      title: "A sample post",
      date: "2026-08-19",
      description: "A public summary.",
      teaser: "A longer public teaser.",
      minutes: 2,
      sample: true,
    };

    expect(helpers).not.toBeNull();
    expect(helpers?.blogPostingJsonLd(post)).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "A sample post",
      description: "A public summary.",
      datePublished: "2026-08-19",
      url: "https://markstuart.dev/posts/sample",
      mainEntityOfPage: "https://markstuart.dev/posts/sample",
      image: "https://markstuart.dev/opengraph-image",
      author: {
        "@type": "Person",
        name: "Mark Stuart",
        url: "https://markstuart.dev",
      },
    });
  });

  it("escapes less-than signs before JSON-LD reaches an HTML script", async () => {
    const helpers = await loadModule<MetadataHelpers>("@/lib/metadata");

    expect(helpers).not.toBeNull();
    expect(helpers?.serializeJsonLd({ headline: "<script>alert(1)</script>" })).toBe(
      '{"headline":"\\u003cscript>alert(1)\\u003c/script>"}'
    );
  });
});
