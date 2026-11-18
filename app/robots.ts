import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/platform", "/api/", "/invite/", "/billing-required"],
      },
    ],
    sitemap: "https://rekalliq.springvoxsl.com/sitemap.xml",
  };
}
