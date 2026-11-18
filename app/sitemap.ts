import type { MetadataRoute } from "next";

import { getBlogPosts } from "@/src/lib/blog";
import { DOCS } from "@/src/lib/docs";

const BASE = "https://rekalliq.springvoxsl.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/product",
    "/solutions",
    "/pricing",
    "/security",
    "/about",
    "/contact",
    "/blog",
    "/privacy",
    "/terms",
    "/acceptable-use",
    "/data-handling",
    "/docs",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${BASE}${route}`,
      lastModified: new Date("2026-11-18"),
      changeFrequency: route === "" || route === "/blog" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : 0.6,
    })),
    ...DOCS.map((doc) => ({
      url: `${BASE}/docs/${doc.slug}`,
      lastModified: new Date("2026-11-18"),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    ...getBlogPosts().map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date("2026-11-18"),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
