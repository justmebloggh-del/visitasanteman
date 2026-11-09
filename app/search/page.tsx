import type { Metadata } from "next";
import { CardGrid, ContentCard, EmptyState, PageHeader } from "@/components/layout/blocks";
import { SearchBox } from "@/components/layout/SearchBox";
import { Container } from "@/components/ui";
import { accommodationTypes, businessTypes, restaurantTypes } from "@/config/site";
import { listAttractions, listExperiences, listListings } from "@/lib/content/public";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const [attractions, stays, food, biz, experiences] = q
    ? await Promise.all([
        listAttractions({ q, limit: 6 }), listListings(accommodationTypes, { q, limit: 6 }), listListings(restaurantTypes, { q, limit: 6 }),
        listListings(businessTypes, { q, limit: 6 }), listExperiences({ q, limit: 6 }),
      ])
    : [];
  const total = q ? (attractions!.total + stays!.total + food!.total + biz!.total + experiences!.total) : 0;
  return (
    <>
      <PageHeader title="Search" crumbs={[{ label: "Search" }]} />
      <Container className="space-y-10 py-10">
        <SearchBox defaultValue={q} className="max-w-2xl border border-line shadow-none" />
        {!q ? <p className="text-muted">Type a name to search attractions, places to stay, restaurants, businesses and experiences.</p>
          : total === 0 ? <EmptyState title={`No results for “${q}”`} text="Check the spelling or try a shorter name." />
          : (
            <>
              <Group title="Attractions" show={attractions!.items.length > 0}>{attractions!.items.map((a) => <ContentCard key={a.id} href={`/attractions/${a.slug}`} title={a.name} summary={a.summary} media={a.cover} />)}</Group>
              <Group title="Accommodation" show={stays!.items.length > 0}>{stays!.items.map((l) => <ContentCard key={l.id} href={`/accommodation/${l.slug}`} title={l.name} summary={l.summary} media={l.cover} />)}</Group>
              <Group title="Restaurants" show={food!.items.length > 0}>{food!.items.map((l) => <ContentCard key={l.id} href={`/restaurants/${l.slug}`} title={l.name} summary={l.summary} media={l.cover} />)}</Group>
              <Group title="Businesses" show={biz!.items.length > 0}>{biz!.items.map((l) => <ContentCard key={l.id} href={`/business/${l.slug}`} title={l.name} summary={l.summary} media={l.cover} />)}</Group>
              <Group title="Experiences" show={experiences!.items.length > 0}>{experiences!.items.map((e) => <ContentCard key={e.id} href={`/experiences/${e.slug}`} title={e.title} summary={e.summary} media={e.cover} />)}</Group>
            </>
          )}
      </Container>
    </>
  );
}

function Group({ title, show, children }: { title: string; show: boolean; children: React.ReactNode }) {
  return show ? <section><h2 className="mb-4 text-2xl font-semibold text-forest">{title}</h2><CardGrid>{children}</CardGrid></section> : null;
}
