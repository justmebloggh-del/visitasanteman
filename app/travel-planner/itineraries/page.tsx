import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Badge, Container } from "@/components/ui";
import { supabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: "Curated itineraries",
  description: "Ready-made trip ideas for the Ashanti Region, built only from places that have been checked. Copy one into your own plan and adjust it.",
  path: "/travel-planner/itineraries",
});

export default async function CuratedList() {
  const { data } = supabaseConfigured ? await createPublicClient().from("curated_itineraries").select("slug,title,theme,summary").eq("status", "published").order("title") : { data: [] };
  const rows = data ?? [];
  return (
    <>
      <PageHeader title="Curated itineraries" intro="Trip ideas built only from places published on this site. Always check opening hours, prices and travel times with each provider." crumbs={[{ label: "Travel planner", href: "/travel-planner" }, { label: "Itineraries" }]} />
      <Container className="py-10">
        {rows.length === 0 ? (
          <EmptyState title="Itineraries are being prepared" text="We publish an itinerary only after its places have been checked and the routes are realistic." action={{ href: "/travel-planner", label: "Build your own plan" }} />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <li key={r.slug}><Link href={`/travel-planner/itineraries/${r.slug}`} className="block h-full rounded-2xl border border-line bg-white p-6 transition hover:shadow-md">
                {r.theme && <Badge tone="gold">{r.theme}</Badge>}
                <h2 className="mt-2 font-serif text-xl font-semibold text-forest">{r.title}</h2>
                {r.summary && <p className="mt-2 text-sm text-muted">{r.summary}</p>}
              </Link></li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
