import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardGrid, ContentCard, PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { getTheme, listThemedItems } from "@/lib/content/public";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = await getTheme((await params).slug);
  if (!t) return { title: "Not found" };
  return buildMetadata({ title: `${t.name} in Ashanti`, description: t.summary, path: `/themes/${t.slug}`, image: t.cover });
}

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getTheme((await params).slug);
  if (!t) notFound();
  const items = await listThemedItems(t.id);
  if (items.length === 0) notFound();          // a theme with nothing published is not a public page
  return (
    <>
      <PageHeader title={t.name} intro={t.summary ?? undefined} crumbs={[{ label: t.kind === "experience_theme" ? "Experience themes" : "Tour categories" }, { label: t.name }]} />
      <Container className="py-10">
        <CardGrid>{items.map((i) => <ContentCard key={i.key} href={i.href} title={i.title} summary={i.summary} media={i.cover} meta={i.kind} />)}</CardGrid>
      </Container>
    </>
  );
}
