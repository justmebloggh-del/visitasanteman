import type { Metadata } from "next";
import { Breadcrumbs, Photo } from "@/components/layout/blocks";
import { AdSlot } from "@/components/ads/AdSlot";
import { Markdown } from "@/components/layout/Markdown";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { getPage } from "@/lib/content/public";

export async function cmsMetadata(slug: string, fallbackTitle: string, path = `/${slug}`): Promise<Metadata> {
  const p = await getPage(slug);
  return buildMetadata({ title: p?.title ?? fallbackTitle, description: p?.seo_description, path, image: p?.cover, seoTitle: p?.seo_title, canonical: p?.canonical_url, noindex: p ? p.noindex : true });
}

export async function CmsPage({ slug, fallbackTitle, crumbs, children }: { slug: string; fallbackTitle: string; crumbs?: { label: string; href?: string }[]; children?: React.ReactNode }) {
  const page = await getPage(slug);
  return (
    <>
      <header className="bg-forest-dark text-white">
        <Container className="py-12 sm:py-16"><div className="mb-4 [&_*]:!text-white/70 [&_[aria-current]]:!text-white"><Breadcrumbs items={[...(crumbs ?? []), { label: page?.title ?? fallbackTitle }]} /></div>
          <h1 className="text-3xl font-semibold sm:text-5xl">{page?.title ?? fallbackTitle}</h1></Container>
      </header>
      {slug.startsWith("culture") && <AdSlot placement="culture_top" />}
      <Container className="py-10">
        {page?.cover && <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-2xl"><Photo media={page.cover} sizes="100vw" priority /></div>}
        {page?.body ? <Markdown>{page.body}</Markdown> : (
          <p className="rounded-2xl bg-mist p-6 text-muted">This page is being prepared. Please check back soon.</p>
        )}
        {children}
      </Container>
    </>
  );
}
