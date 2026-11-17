import { PageTop } from "@/components/banners/PageTop";
import { images } from "@/config/images";
import type { Metadata } from "next";
import { CardGrid, ContentCard, EmptyState, StaticPhoto } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { districtKindLabels, listedDistricts, type DistrictKind } from "@/config/districts";
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
      <PageTop banner="explore" title="Districts" intro="The Ashanti Region is governed through metropolitan, municipal and district assemblies. Start with the area you plan to visit." crumbs={[{ label: "Districts" }]} />
      <Container className="space-y-12 py-10">
        <figure className="mx-auto" style={{ maxWidth: images.districtMap.width }}>
          <StaticPhoto image="districtMap" className="w-full rounded-2xl border border-line bg-white" />
          <figcaption className="mt-2 text-sm text-muted">{images.districtMap.caption}</figcaption>
        </figure>
        {areas.length === 0 ? (
          <section aria-labelledby="listed-districts">
            <EmptyState title="Districts are being added" text="We list each district from the official list of assemblies, and publish places in it only after they have been checked." />
            <h2 id="listed-districts" className="mt-12 text-2xl font-semibold text-forest">The assemblies of the Ashanti Region</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              The region has {listedDistricts.length} assemblies: {listedDistricts.filter((d) => d.kind === "metropolitan").length} metropolitan, {listedDistricts.filter((d) => d.kind === "municipal").length} municipal and {listedDistricts.filter((d) => d.kind === "district").length} district.
              This list comes from published secondary sources (Ghana Statistical Service figures and Wikipedia&rsquo;s list of the districts of Ghana). It is still being checked against the Local Government Service list, so names and categories may change. A district gets its own page once its places have been checked.
            </p>
            <div className="mt-8 space-y-10">
              {(["metropolitan", "municipal", "district"] as DistrictKind[]).map((k) => (
                <div key={k}>
                  <h3 className="mb-4 font-serif text-xl font-semibold text-forest">{districtKindLabels[k]} <span className="text-base font-normal text-muted">({listedDistricts.filter((d) => d.kind === k).length})</span></h3>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {listedDistricts.filter((d) => d.kind === k).map((d) => (
                      <li key={d.name} className="rounded-xl border border-line bg-white px-4 py-3 text-ink">{d.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
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
