import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Map } from "@/components/maps/Map";
import { Container } from "@/components/ui";
import { getMapPoints, getSettings } from "@/lib/content/public";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({ title: "Tourism map", description: "Interactive map of attractions, communities, accommodation, restaurants and events across the Ashanti Region.", path: "/map" });

export default async function MapPage() {
  const [points, settings] = await Promise.all([getMapPoints(), getSettings()]);
  const m = settings.map ?? {};
  return (
    <>
      <PageHeader title="Tourism map" intro="Filter by category, search for a place, then open it for details and directions." crumbs={[{ label: "Map" }]} />
      <Container className="py-8"><Map points={points} filters center={[Number(m.center_lng ?? -1.41), Number(m.center_lat ?? 6.5)]} zoom={Number(m.zoom ?? 11)} /></Container>
    </>
  );
}
