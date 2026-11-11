import type { Metadata } from "next";
import { CardGrid, ContentCard, EmptyState, PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { getAreaContentCounts, listAreas } from "@/lib/content/public";

export const revalidate = 60;
const areaKindPlural = { metropolitan: "Metropolitan Assemblies", municipal: "Municipal Assemblies", district: "District Assemblies" } as const;
export const metadata: Metadata = buildMetadata({
  title: "Districts of Asanteman",
  description: "Explore Asanteman district by district: the metropolitan, municipal and district assemblies and the places to visit in each.",
  path: "/districts",
});

export default async function DistrictsPage() {
  const [areas, counts] = await Promise.all([listAreas(), getAreaContentCounts()]);
  const groups = (["metropolitan", "municipal", "district"] as const).map((kind) => ({ kind, items: areas.filter((a) => a.kind === kind) })).filter((g) => g.items.length);

  return (
    <>
      <PageHeader title="Districts" intro="The Ashanti Region is governed through metropolitan, municipal and district assemblies. Start with the area you plan to visit." crumbs={[{ label: "Districts" }]} />
      <Container className="space-y-12 py-10">
        {areas.length === 0 ? (
          <EmptyState title="Districts are being added" text="We list each district from the official list of assemblies, and publish places in it only after they have been checked." />
        ) : groups.map((g) => (
          <section key={g.kind}>
            <h2 className="mb-5 text-2xl font-semibold text-forest">{areaKindPlural[g.kind]}</h2>
            <CardGrid>
              {g.items.map((a) => {
                const n = counts[a.id] ?? 0;
                return <ContentCard key={a.id} href={`/districts/${a.slug}`} title={a.name} summary={a.summary} media={a.cover}
                  meta={n > 0 ? `${n} published ${n === 1 ? "place" : "places"}` : "Places being added"} />;
              })}
            </CardGrid>
          </section>
        ))}
      </Container>
    </>
  );
}
