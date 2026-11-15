import type { Metadata } from "next";
import Link from "next/link";
import { CardGrid, ContentCard, EmptyState, PageHeader, Pagination } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { getArticleCategories, listArticles, toPage } from "@/lib/content/public";
import { cn, formatDate } from "@/lib/utils";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: "Stories, guides and news",
  description: "Destination news, travel guides, culture and community stories from across Asanteman.",
  path: "/articles",
});

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const sp = await searchParams;
  const [result, categories] = await Promise.all([listArticles({ category: sp.category, page: toPage(sp.page) }), getArticleCategories()]);
  return (
    <>
      <PageHeader title="Stories and travel inspiration" intro="Guides, culture and news from across Asanteman." crumbs={[{ label: "Articles" }]} />
      <Container className="py-10">
        <nav aria-label="Categories" className="mb-8 flex flex-wrap gap-2">
          <Link href="/articles" className={cn("rounded-full border px-4 py-1.5 text-sm", !sp.category ? "border-forest bg-forest text-white" : "border-line")}>All</Link>
          {categories.map((c) => <Link key={c.slug} href={`/articles?category=${c.slug}`} className={cn("rounded-full border px-4 py-1.5 text-sm", sp.category === c.slug ? "border-forest bg-forest text-white" : "border-line")}>{c.name}</Link>)}
        </nav>
        {result.items.length === 0 ? <EmptyState title="No articles yet" text="Stories and guides will be published here soon." /> : (
          <CardGrid>{result.items.map((a) => <ContentCard key={a.id} href={`/articles/${a.slug}`} title={a.title} summary={a.excerpt} media={a.cover} meta={[a.category?.name, a.published_at && formatDate(a.published_at)].filter(Boolean).join(" · ")} />)}</CardGrid>
        )}
        <Pagination page={result.page} pageCount={result.pageCount} basePath="/articles" params={{ category: sp.category }} />
      </Container>
    </>
  );
}
