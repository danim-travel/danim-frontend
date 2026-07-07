import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/write",
        "/mypage",
        "/settings",
        "/followers",
        "/dm",
        "/social-callback",
        "/reset-password",
      ],
    },
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
