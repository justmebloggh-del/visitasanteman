import type { Metadata } from "next";
import { DomainDetail } from "@/components/listings/DomainPages";
import { buildMetadata } from "@/components/layout/seo";
import { educationCfg as cfg } from "@/config/domains";
import { getDomainRecord } from "@/lib/content/domains";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = await getDomainRecord(cfg, (await params).slug);
  if (!r) return { title: "Not found" };
  return buildMetadata({ title: r.name, description: r.summary, path: `${cfg.base}/${r.slug}`, image: r.cover, seoTitle: r.seo_title, seoDescription: r.seo_description, canonical: r.canonical_url, noindex: r.noindex });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <DomainDetail cfg={cfg} slug={(await params).slug} />;
}
