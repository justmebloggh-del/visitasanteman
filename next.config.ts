import type { NextConfig } from "next";
import { redirectRules } from "./config/redirects";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const origin = (u?: string) => { try { return u ? new URL(u).origin : undefined; } catch { return undefined; } };
const supabaseOrigin = origin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const siteIsHttps = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy (production only: the dev server needs eval and websockets).
 * Inline scripts are allowed because Next.js injects inline hydration scripts; everything else is restricted to this site,
 * the Supabase project, OpenStreetMap map tiles and, if configured, Google Analytics.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://tile.openstreetmap.org https://www.google-analytics.com https://www.googletagmanager.com ${supabaseOrigin ?? ""}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' https://tile.openstreetmap.org https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com ${supabaseOrigin ?? ""} ${supabaseOrigin ? supabaseOrigin.replace(/^http/, "ws") : ""}`.replace(/\s+/g, " ").trim(),
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.paystack.com https://*.paystack.co",
  "frame-ancestors 'none'",
  ...(siteIsHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  async redirects() {
    return redirectRules.map((r) => ({ ...r, permanent: true }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
