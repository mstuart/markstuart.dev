import type { MetadataRoute } from "next";
import { site } from "@/lib/data/site";
import { getAllPosts } from "@/lib/posts";

const STATIC_ROUTES = [
  "",
  "/work",
  "/work/full",
  "/posts",
  "/projects",
  "/press",
  "/talks",
  "/listening",
  "/stack",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${site.url}${route}`,
  }));

  const postEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${site.url}/posts/${post.slug}`,
    lastModified: post.date,
  }));

  return [...staticEntries, ...postEntries];
}
