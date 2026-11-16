import type { Metadata } from "next";
import { PageHeader, Photo, StaticPhoto } from "@/components/layout/blocks";
import { AdSlot } from "@/components/ads/AdSlot";
import { Markdown } from "@/components/layout/Markdown";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { images, pageImages } from "@/config/images";
import { getPage } from "@/lib/content/public";
import { formatDate, safeUrl } from "@/lib/utils";

export async function cmsMetadata(slug: string, fallbackTitle: string, path = `/${slug}`): Promise<Metadata> {
  const p = await getPage(slug);
  return buildMetadata({ title: p?.title ?? fallbackTitle, description: p?.seo_description, path, image: p?.cover, seoTitle: p?.seo_title, canonical: p?.canonical_url, noindex: p ? p.noindex : true });
}

export async function CmsPage({ slug, fallbackTitle, crumbs, children, banner, fallback: emptyFallback, bannerIsHeader }: { slug: string; fallbackTitle: string; crumbs?: { label: string; href?: string }[]; children?: React.ReactNode; banner?: React.ReactNode; /** The banner opens the page and replaces the title block. */ bannerIsHeader?: boolean; /** Shown instead of "being prepared" when the page has no written body. */ fallback?: React.ReactNode }) {
  const page = await getPage(slug);
  const fallbackKey = pageImages[slug];
  const fallback = page?.body && fallbackKey ? images[fallbackKey] : null;
  const hasImage = !!page?.cover || !!fallback;
  return (
    <>
      {!bannerIsHeader && <PageHeader title={page?.title ?? fallbackTitle} crumbs={[...(crumbs ?? []), { label: page?.title ?? fallbackTitle }]} />}
      {banner}
      {slug.startsWith("culture") && <AdSlot placement="culture_top" />}
      <Container className={`py-10 ${hasImage ? "grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10" : ""}`}>
        {/* The page photograph sits at the top-right of the content (first on phones). It is the uploaded cover, or a built-in picture. */}
        {hasImage && (
          <figure className="order-1 lg:order-2">
            {page?.cover ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-forest-soft shadow-md"><Photo media={page.cover} sizes="(min-width:1024px) 22rem, 100vw" priority /></div>
            ) : (
              <StaticPhoto image={fallbackKey!} priority className="max-h-[26rem] rounded-2xl border border-line shadow-md" />
            )}
            {!page?.cover && fallback?.caption && <figcaption className="mt-2 text-sm text-muted">{fallback.caption}</figcaption>}
          </figure>
        )}
        <div className="order-2 min-w-0 lg:order-1">
          {page?.body && (page.last_verified_at || page.source_label || page.source_url) && (
            <p className="mb-6 rounded-xl bg-mist p-4 text-sm text-muted">
              {page.last_verified_at && <><strong className="text-ink">Last verified:</strong> {formatDate(page.last_verified_at)}. </>}
              {(page.source_label || page.source_url) && <><strong className="text-ink">Source:</strong> {page.source_label ?? "official source"}{page.source_url && safeUrl(page.source_url) && <> (<a href={safeUrl(page.source_url)!} className="underline" rel="noopener noreferrer" target="_blank">link</a>)</>}.</>}
            </p>
          )}
          {page?.body ? <Markdown>{page.body}</Markdown> : emptyFallback ?? (
            <p className="rounded-2xl bg-mist p-6 text-muted">This page is being prepared. Please check back soon.</p>
          )}
          {children}
        </div>
      </Container>
    </>
  );
}
