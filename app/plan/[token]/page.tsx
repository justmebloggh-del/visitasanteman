import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/blocks";
import { Map } from "@/components/maps/Map";
import { PlanDays } from "@/components/planner/PlanDays";
import { ButtonLink, Container } from "@/components/ui";
import { getSettings } from "@/lib/content/public";
import { supabaseConfigured } from "@/lib/env";
import { kindFromHref, type PlanView } from "@/lib/planner/types";
import { createPublicClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shared travel plan", robots: { index: false, follow: false } };

export default async function SharedPlan({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!supabaseConfigured || !/^[A-Za-z0-9_-]{22,64}$/.test(token)) notFound();
  const plan = (await createPublicClient().rpc("itinerary_view", { p_token: token })).data as PlanView | null;
  if (!plan) notFound();
  const settings = await getSettings(); const m = settings.map ?? {};
  const points = plan.items.filter((i) => i.lat != null && i.lng != null && !i.unavailable).map((i) => ({ id: i.id, kind: kindFromHref(i.href), title: i.title ?? "", href: i.href ?? "#", lat: Number(i.lat), lng: Number(i.lng) }));
  return (
    <>
      <PageHeader title={plan.title} intro={`${plan.days} day${plan.days > 1 ? "s" : ""} for ${plan.travellers} traveller${plan.travellers > 1 ? "s" : ""}. Shared plan (read-only).`} />
      <Container className="max-w-4xl space-y-8 py-10">
        {plan.notes && <p className="whitespace-pre-line">{plan.notes}</p>}
        <PlanDays plan={plan} editable={false} />
        {points.length > 0 && <Map points={points} center={[points[0].lng ?? Number(m.center_lng ?? -1.41), points[0].lat ?? Number(m.center_lat ?? 6.5)]} zoom={12} />}
        <ButtonLink href="/travel-planner">Make your own plan</ButtonLink>
      </Container>
    </>
  );
}
