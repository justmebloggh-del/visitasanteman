import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Printer, Share2, Sparkles } from "lucide-react";
import { addCustom, addPlace, deletePlan, makeCurated, suggestItinerary, toggleShare } from "@/app/actions/planner";
import { Breadcrumbs } from "@/components/layout/blocks";
import { Map } from "@/components/maps/Map";
import { PlanDays } from "@/components/planner/PlanDays";
import { PlanForm } from "@/components/planner/PlanForm";
import { Button, Container, Field, Input, Notice, Select } from "@/components/ui";
import { aiEnabled } from "@/lib/ai/assistant";
import { getSessionUser, isStaff } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/env";
import { listAttractions, listExperiences } from "@/lib/content/public";
import { searchPlaces } from "@/lib/planner/search";
import { recommend } from "@/lib/planner/recommend";
import { kindFromHref, type PlanView } from "@/lib/planner/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your travel plan", robots: { index: false } };

export default async function PlanEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; notice?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const me = await getSessionUser();
  if (!me) redirect(`/login?next=/travel-planner/${id}`);
  const supabase = await createClient();
  const { data } = await supabase.rpc("itinerary_view", { p_id: id });
  const plan = data as PlanView | null;
  if (!plan) notFound();

  const q = (sp.q ?? "").slice(0, 60);
  const [groups, attractions, experiences] = await Promise.all([
    searchPlaces(q), plan.interests.length ? listAttractions({ limit: 40 }) : null, plan.interests.length ? listExperiences({ limit: 40 }) : null,
  ]);
  const picks = attractions && experiences ? recommend(plan.interests, attractions.items, experiences.items, 3) : null;
  const inPlan = new Set(plan.items.map((i) => i.item_id));
  const points = plan.items.filter((i) => i.lat != null && i.lng != null && !i.unavailable).map((i) => ({ id: i.id, kind: kindFromHref(i.href), title: i.title ?? "", href: i.href ?? "#", lat: Number(i.lat), lng: Number(i.lng) }));
  const drafts = isStaff(me.role) ? ((await supabase.from("curated_itineraries").select("id,title").is("itinerary_id", null).eq("status", "draft").is("deleted_at", null).order("title")).data ?? []) : [];
  const dayOptions = Array.from({ length: plan.days }, (_, d) => d + 1);
  const shareUrl = plan.shared ? `${SITE_URL}/plan/${(await supabase.from("travel_itineraries").select("share_token").eq("id", id).single()).data?.share_token}` : null;

  const AddForm = ({ type, itemId, title }: { type: string; itemId: string; title: string }) => (
    <form action={addPlace.bind(null, id)} className="flex items-center gap-1.5">
      <input type="hidden" name="item_type" value={type} /><input type="hidden" name="item_id" value={itemId} />
      <label className="sr-only" htmlFor={`d-${itemId}`}>Day for {title}</label>
      <Select id={`d-${itemId}`} name="day" className="h-9 w-24">{dayOptions.map((d) => <option key={d} value={d}>Day {d}</option>)}</Select>
      <Button size="sm" aria-label={`Add ${title} to plan`}>Add</Button>
    </form>
  );

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Travel planner", href: "/travel-planner" }, { label: plan.title }]} />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold text-forest">{plan.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href={`/travel-planner/${id}/print`} className="inline-flex h-9 items-center gap-2 rounded-full border border-forest/30 px-4 text-sm font-medium text-forest hover:bg-forest-soft"><Printer className="size-4" aria-hidden />Print view</Link>
          <form action={toggleShare.bind(null, id)}><Button size="sm" variant="outline"><Share2 className="size-4" aria-hidden />{plan.shared ? "Stop sharing" : "Create share link"}</Button></form>
        </div>
      </div>
      {sp.notice && <div className="mt-4"><Notice tone="info">{sp.notice}</Notice></div>}
      {shareUrl && <p className="mt-3 break-all rounded-xl bg-mist p-3 text-sm">Anyone with this link can view this plan (read-only): <a className="text-lake-dark underline" href={shareUrl}>{shareUrl}</a></p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <PlanDays plan={plan} editable />
          {points.length > 0 && <section><h2 className="mb-3 text-xl font-semibold text-forest">Your plan on the map</h2><Map points={points} center={[points[0].lng, points[0].lat]} zoom={12} /></section>}
          <details className="rounded-2xl border border-line bg-white p-5"><summary className="cursor-pointer font-semibold text-forest">Plan details</summary><div className="mt-4"><PlanForm plan={plan} /></div></details>
          {isStaff(me.role) && (
            <details className="rounded-2xl border border-line bg-white p-5"><summary className="cursor-pointer font-semibold text-forest">Publish as a curated itinerary (staff)</summary>
              <form action={makeCurated.bind(null, id)} className="mt-4 grid gap-3">
                <p className="text-xs text-muted">Creates a draft for the public itinerary list and turns on the share link. Only add places that are published and verified, and check that routes and times are realistic before publishing.</p>
                <Field label="Title" htmlFor="cur-title"><Input id="cur-title" name="title" defaultValue={plan.title} required maxLength={150} /></Field>
                <Field label="Theme" htmlFor="cur-theme"><Input id="cur-theme" name="theme" placeholder="e.g. Heritage" maxLength={60} /></Field>
                <Field label="Summary" htmlFor="cur-summary"><Input id="cur-summary" name="summary" maxLength={400} /></Field>
                <Field label="Attach to an existing draft" htmlFor="cur-attach"><Select id="cur-attach" name="attach" defaultValue=""><option value="">Create a new itinerary</option>{drafts.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</Select></Field>
                <div><Button size="sm">Create curated draft</Button></div>
              </form>
            </details>
          )}
          <form action={deletePlan.bind(null, id)}><Button variant="danger" size="sm">Delete this plan</Button></form>
        </div>

        <aside className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="mb-3 font-serif text-lg font-semibold text-forest">Add places</h2>
            <form method="get" className="mb-4 flex gap-2"><label className="sr-only" htmlFor="pq">Search places</label><Input id="pq" name="q" defaultValue={q} placeholder="Search by name" /><Button variant="outline">Search</Button></form>
            {groups.length === 0 ? <p className="text-sm text-muted">{q ? "No matches." : "Nothing has been published to add yet."}</p> : groups.map((g) => (
              <div key={g.label} className="mb-4"><h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-lake-dark">{g.label}</h3>
                <ul className="divide-y divide-line">{g.items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-2 py-2"><span className="text-sm"><strong>{it.title}</strong>{it.sub && <span className="block text-xs text-muted capitalize">{it.sub}</span>}{inPlan.has(it.id) && <span className="text-xs text-forest"> · in plan</span>}</span><AddForm type={it.type} itemId={it.id} title={it.title} /></li>
                ))}</ul></div>
            ))}
            <form action={addCustom.bind(null, id)} className="mt-4 border-t border-line pt-4">
              <Field label="Or add your own item" htmlFor="custom-title"><Input id="custom-title" name="title" placeholder="e.g. Lunch break" maxLength={150} /></Field>
              <div className="mt-2 flex gap-2"><label className="sr-only" htmlFor="custom-day">Day</label><Select id="custom-day" name="day" className="h-9 w-24">{dayOptions.map((d) => <option key={d} value={d}>Day {d}</option>)}</Select><Button size="sm" variant="outline">Add</Button></div>
            </form>
          </section>

          {picks && (picks.attractions.length > 0 || picks.experiences.length > 0) && (
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="mb-1 font-serif text-lg font-semibold text-forest">Suggested for your interests</h2>
              <p className="mb-3 text-xs text-muted">Matched to: {plan.interests.join(", ")}</p>
              <ul className="divide-y divide-line">
                {picks.attractions.filter((a) => !inPlan.has(a.id)).map((a) => <li key={a.id} className="flex items-center justify-between gap-2 py-2"><span className="text-sm font-medium">{a.name}</span><AddForm type="attraction" itemId={a.id} title={a.name} /></li>)}
                {picks.experiences.filter((e) => !inPlan.has(e.id)).map((e) => <li key={e.id} className="flex items-center justify-between gap-2 py-2"><span className="text-sm font-medium">{e.title}</span><AddForm type="experience" itemId={e.id} title={e.title} /></li>)}
              </ul>
            </section>
          )}

          {aiEnabled() && (
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="mb-1 font-serif text-lg font-semibold text-forest">AI suggestions</h2>
              <p className="mb-3 text-xs text-muted">Builds suggestions using only places listed on this site, based on your days, travellers and interests. Review everything before relying on it.</p>
              <form action={suggestItinerary.bind(null, id)}><Button size="sm"><Sparkles className="size-4" aria-hidden />Suggest places for my plan</Button></form>
            </section>
          )}
        </aside>
      </div>
    </Container>
  );
}
