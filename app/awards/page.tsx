import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Photo } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Badge, Container } from "@/components/ui";
import { listAwardProgrammes } from "@/lib/content/public";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({ title: "Awards", description: "Award programmes of VisitAsanteman: categories, eligibility, evaluation criteria and how to nominate.", path: "/awards" });

export default async function AwardsPage() {
  const programmes = await listAwardProgrammes();
  return (
    <>
      <PageHeader title="Awards" intro="Recognising excellence in Asanteman. Every programme publishes its categories, eligibility rules and evaluation criteria. Sponsorship or payment never guarantees a nomination or an award." crumbs={[{ label: "Awards" }]} />
      <Container className="py-10">
        {programmes.length === 0 ? (
          <p className="rounded-2xl bg-mist p-6 text-muted">No award programmes have been announced yet. Please check back soon.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2">
            {programmes.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                {p.cover && <div className="relative aspect-[16/9]"><Photo media={p.cover} alt={p.title} sizes="(min-width: 640px) 50vw, 100vw" /></div>}
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-forest"><Link href={`/awards/${p.slug}`} className="hover:underline">{p.title}</Link></h2>
                  {p.year && <p className="text-sm text-muted">{p.year}</p>}
                  {p.summary && <p className="mt-2 text-sm">{p.summary}</p>}
                  {p.nominations_open && <Badge tone="green" className="mt-3">Nominations open</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
