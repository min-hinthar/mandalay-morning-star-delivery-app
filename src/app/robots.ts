import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/driver/",
        "/api/",
        "/auth/",
        "/cart",
        "/checkout",
        "/account",
        "/orders",
        "/debug/",
      ],
    },
    sitemap: "https://mandalaymorningstar.com/sitemap.xml",
  };
}
