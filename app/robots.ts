import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/register", "/auth", "/search", "/api/ads", "/plan", "/travel-planner/", "/booking", "/account", "/api", "/partner/dashboard", "/partner/listings", "/partner/enquiries", "/partner/subscription", "/partner/settings"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
