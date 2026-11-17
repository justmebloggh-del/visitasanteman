import Link from "next/link";
import { Block, CardGrid, ContentCard, Photo } from "@/components/layout/blocks";
import { asMedia, categoryImages } from "@/config/images";
import { educationCfg, sportsCfg, transportCfg } from "@/config/domains";
import { listDomain } from "@/lib/content/domains";
import { getCategoryCards, getHomepageSections, listCommunities, listDestinations } from "@/lib/content/public";

/**
 * Sections that used to sit on the homepage and belong with the attractions: featured destinations and districts, attractions by
 * type, communities, and education, sports and transport places. Each part appears only when it has published records.
 */
export async function AttractionsShowcase() {
  const [sections, destinations, categoryCards, communities, education, sports, transport] = await Promise.all([
    getHomepageSections(), listDestinations({ limit: 6 }), getCategoryCards(), listCommunities(),
    listDomain(educationCfg, { limit: 3 }), listDomain(sportsCfg, { limit: 3 }), listDomain(transportCfg, { limit: 3 }),
  ]);
  const on = (k: string) => sections[k]?.is_enabled !== false;
  const domains = [{ cfg: educationCfg, data: education, heading: "Education and learning" }, { cfg: sportsCfg, data: sports, heading: "Sports and recreation" }, { cfg: transportCfg, data: transport, heading: "Getting around" }]
    .filter((x) => x.data.items.length > 0);

  return (
    <>
      {on("destinations") && destinations.length > 0 && (
        <Block title={sections.destinations?.title ?? "Explore the region"} subtitle={sections.destinations?.subtitle ?? "Featured destinations and the districts of Asanteman."} more={{ href: "/districts", label: "All districts" }}>
          <CardGrid>
            {destinations.map((d) => <ContentCard key={d.id} href={`/destinations/${d.slug}`} title={d.name} summary={d.summary} media={d.cover} meta={d.area?.name} />)}
          </CardGrid>
        </Block>
      )}

      {categoryCards.length > 0 && (
        <Block tone="mist" title="Explore by type" subtitle="Find attractions by what they are.">
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categoryCards.map((c) => (
              <li key={c.id}><Link href={`/attractions?category=${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-forest-dark">
                <Photo media={c.cover ?? asMedia(categoryImages[c.slug])} sizes="(min-width:1024px) 25vw, 50vw" className="opacity-70 transition duration-500 group-hover:scale-105 motion-reduce:transition-none" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white"><span className="block font-serif text-lg font-semibold">{c.name}</span><span className="text-sm text-white/85">{c.count} {c.count === 1 ? "attraction" : "attractions"}</span></span>
              </Link></li>
            ))}
          </ul>
        </Block>
      )}

      {on("communities") && communities.length > 0 && (
        <Block title={sections.communities?.title ?? "Discover our communities"} subtitle={sections.communities?.subtitle ?? "Towns and villages of Asanteman."} more={{ href: "/communities", label: "All communities" }}>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {communities.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link href={`/communities/${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-forest">
                  <Photo media={c.cover} sizes="(min-width:1024px) 25vw, 50vw" className="opacity-80 transition duration-500 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 font-serif text-lg font-semibold text-white">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {domains.map((x, i) => (
        <Block key={x.cfg.key} tone={i % 2 === 0 ? "mist" : undefined} title={x.heading} more={{ href: x.cfg.base, label: `All ${x.cfg.noun}s` }}>
          <CardGrid>
            {x.data.items.map((r) => <ContentCard key={r.id} href={`${x.cfg.base}/${r.slug}`} title={r.name} summary={r.summary} media={r.cover} meta={[x.cfg.kindColumn ? x.cfg.kinds?.[String(r[x.cfg.kindColumn])] : null, r.area?.name].filter(Boolean).join(" · ")} />)}
          </CardGrid>
        </Block>
      ))}
    </>
  );
}
