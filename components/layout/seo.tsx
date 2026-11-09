import type { Metadata } from "next";
import { SITE_URL } from "@/lib/env";
import { siteConfig } from "@/config/site";
import { mediaUrl } from "@/lib/utils";
import type { MediaRef } from "@/types/content";

/** Renders JSON-LD. Content is serialised with < escaped so it cannot close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function buildMetadata(o: {
  title: string; description?: string | null; path: string; image?: MediaRef | null;
  seoTitle?: string | null; seoDescription?: string | null; canonical?: string | null; noindex?: boolean;
}): Metadata {
  const title = o.seoTitle || o.title;
  const description = (o.seoDescription || o.description || siteConfig.description).slice(0, 160);
  const url = o.canonical || `${SITE_URL}${o.path}`;
  const img = mediaUrl(o.image?.path);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: o.noindex ? { index: false, follow: false } : undefined,
    openGraph: { title, description, url, siteName: siteConfig.name, type: "website", images: img ? [{ url: img }] : undefined },
    twitter: { card: img ? "summary_large_image" : "summary", title, description, images: img ? [img] : undefined },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
}
