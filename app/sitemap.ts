import type { MetadataRoute } from "next";
import { projectCaseStudies } from "@/lib/data/project-case-studies";
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

  const projectEntries: MetadataRoute.Sitemap = projectCaseStudies.map((project) => ({
    url: `${site.url}/projects/${project.slug}`,
  }));

  return [...staticEntries, ...postEntries, ...projectEntries];
}
