import type { Metadata } from "next";
import { ListingIndex } from "@/components/listings/ListingPages";
import { buildMetadata } from "@/components/layout/seo";
import { venuesGroup as group } from "@/config/groups";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({ title: group.title, description: group.intro, path: "/venues" });

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <ListingIndex group={group} searchParams={await searchParams} />;
}
