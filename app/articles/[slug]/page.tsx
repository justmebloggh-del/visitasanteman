import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, CardGrid, ContentCard, Photo } from "@/components/layout/blocks";
import { Markdown } from "@/components/layout/Markdown";
import { breadcrumbLd, buildMetadata, JsonLd } from "@/components/layout/seo";
import { Badge, Container } from "@/components/ui";
import { SITE_URL } from "@/lib/env";
import { getArticle, listArticles } from "@/lib/content/public";
import { formatDate, mediaUrl } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  if (!a) return { title: "Not found" };
  return buildMetadata({ title: a.title, description: a.excerpt, path: `/articles/${a.slug}`, image: a.cover, seoTitle: a.seo_title, seoDescription: a.seo_description, canonical: a.canonical_url, noindex: a.noindex });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getArticle((await params).slug);
  if (!a) notFound();
  const related = (await listArticles({ category: a.category?.slug, limit: 4, excludeId: a.id })).items.slice(0, 3);
  const url = `${SITE_URL}/articles/${a.slug}`;
  const share = (base: string) => `${base}${encodeURIComponent(url)}`;
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: a.title, datePublished: a.published_at ?? undefined, image: mediaUrl(a.cover?.path) ?? undefined, mainEntityOfPage: url }} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Articles", path: "/articles" }, { name: a.title, path: `/articles/${a.slug}` }])} />
      <Container className="max-w-4xl py-10">
        <Breadcrumbs items={[{ label: "Articles", href: "/articles" }, { label: a.title }]} />
        <h1 className="mt-4 text-3xl font-semibold text-forest sm:text-5xl">{a.title}</h1>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">{a.category && <Badge tone="blue">{a.category.name}</Badge>}{a.published_at && <time dateTime={a.published_at}>{formatDate(a.published_at)}</time>}</p>
        {a.cover && <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl"><Photo media={a.cover} sizes="(min-width:896px) 896px, 100vw" priority /></div>}
        <div className="mt-8"><Markdown>{a.body}</Markdown></div>
        {a.tags.length > 0 && <ul className="mt-8 flex flex-wrap gap-2">{a.tags.map((t) => <li key={t}><Badge>{t}</Badge></li>)}</ul>}
        <p className="mt-8 flex flex-wrap gap-4 border-t border-line pt-5 text-sm">
          <span className="text-muted">Share:</span>
          <a className="text-lake-dark hover:underline" target="_blank" rel="noopener noreferrer" href={share("https://www.facebook.com/sharer/sharer.php?u=")}>Facebook</a>
          <a className="text-lake-dark hover:underline" target="_blank" rel="noopener noreferrer" href={share("https://wa.me/?text=")}>WhatsApp</a>
          <a className="text-lake-dark hover:underline" target="_blank" rel="noopener noreferrer" href={share("https://twitter.com/intent/tweet?url=")}>X</a>
        </p>
      </Container>
      {related.length > 0 && <Container className="pb-4"><h2 className="mb-5 text-2xl font-semibold text-forest">Related articles</h2><CardGrid>{related.map((r) => <ContentCard key={r.id} href={`/articles/${r.slug}`} title={r.title} summary={r.excerpt} media={r.cover} />)}</CardGrid></Container>}
    </>
  );
}
