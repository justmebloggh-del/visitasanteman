import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copyCurated } from "@/app/actions/planner";
import { PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Map } from "@/components/maps/Map";
import { PlanDays } from "@/components/planner/PlanDays";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Container, Notice } from "@/components/ui";
import { getSettings } from "@/lib/content/public";
import { supabaseConfigured } from "@/lib/env";
import { kindFromHref, type PlanView } from "@/lib/planner/types";
import { createPublicClient } from "@/lib/supabase/server";

export const revalidate = 60;
type Curated = { title: string; summary: string | null; theme: string | null; plan: PlanView };
const load = async (slug: string) => (supabaseConfigured ? ((await createPublicClient().rpc("curated_itinerary_view", { p_slug: slug })).data as Curated | null) : null);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await load((await params).slug);
  return c ? buildMetadata({ title: c.title, description: c.summary, path: `/travel-planner/itineraries/${(await params).slug}` }) : { title: "Not found" };
}

export default async function CuratedItinerary({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const { slug } = await params;
  const c = await load(slug);
  if (!c) notFound();
  const sp = await searchParams;
  const settings = await getSettings(); const m = settings.map ?? {};
  const plan = c.plan;
  const points = plan.items.filter((i) => i.lat != null && i.lng != null && !i.unavailable).map((i) => ({ id: i.id, kind: kindFromHref(i.href), title: i.title ?? "", href: i.href ?? "#", lat: Number(i.lat), lng: Number(i.lng) }));
  return (
    <>
      <PageHeader title={c.title} intro={c.summary ?? `${plan.days} day${plan.days > 1 ? "s" : ""}`} crumbs={[{ label: "Travel planner", href: "/travel-planner" }, { label: "Itineraries", href: "/travel-planner/itineraries" }, { label: c.title }]} />
      <Container className="max-w-4xl space-y-8 py-10">
        {sp.error && <Notice tone="error">That did not work. Please try again.</Notice>}
        <Notice tone="info">This is a suggestion, not a booking. Check opening hours, prices, availability and travel times with each provider before you go.</Notice>
        <PlanDays plan={plan} editable={false} />
        {points.length > 0 && <Map points={points} center={[points[0].lng ?? Number(m.center_lng ?? -1.6), points[0].lat ?? Number(m.center_lat ?? 6.7)]} zoom={11} />}
        <form action={copyCurated.bind(null, slug)}><SubmitButton pendingText="Copying…">Use as a starting point</SubmitButton><p className="mt-2 text-sm text-muted">Copies it into your own plans, where you can change anything. You will be asked to sign in.</p></form>
      </Container>
    </>
  );
}
