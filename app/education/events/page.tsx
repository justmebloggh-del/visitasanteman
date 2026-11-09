import type { Metadata } from "next";
import { CategoryEvents } from "@/components/listings/CategoryEvents";
import { buildMetadata } from "@/components/layout/seo";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({ title: "Education events", description: "Open days, public lectures and other learning events confirmed by the institutions.", path: "/education/events" });

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <CategoryEvents category="education" title="Education events" intro="Open days, public lectures and other learning events confirmed by the institutions." base="/education/events" crumbs={[{ label: "Education", href: "/education" }, { label: "Events" }]} page={(await searchParams).page} />;
}
