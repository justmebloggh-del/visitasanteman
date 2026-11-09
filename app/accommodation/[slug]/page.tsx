import type { Metadata } from "next";
import { ListingDetail, listingMetadataData } from "@/components/listings/ListingPages";
import { buildMetadata } from "@/components/layout/seo";
import { accommodationGroup as group } from "@/config/groups";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const l = await listingMetadataData((await params).slug, group.types);
  if (!l) return { title: "Not found" };
  return buildMetadata({ title: l.name, description: l.summary, path: `/${group.detail}/${l.slug}`, image: l.cover, seoTitle: l.seo_title, seoDescription: l.seo_description, canonical: l.canonical_url, noindex: l.noindex });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ListingDetail group={group} slug={(await params).slug} />;
}
