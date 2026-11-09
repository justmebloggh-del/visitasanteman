import type { Metadata } from "next";
import { CategoryEvents } from "@/components/listings/CategoryEvents";
import { buildMetadata } from "@/components/layout/seo";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({ title: "Sports events", description: "Sporting events with details confirmed by organisers.", path: "/sports/events" });

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <CategoryEvents category="sports" title="Sports events" intro="Sporting events with details confirmed by organisers." base="/sports/events" crumbs={[{ label: "Sports", href: "/sports" }, { label: "Events" }]} page={(await searchParams).page} />;
}
