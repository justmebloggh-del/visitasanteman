import { notFound, redirect } from "next/navigation";
import { blockDates, partnerAddChild, partnerDeleteChild, requestVerification, savePartnerListing, unblockDate } from "@/app/partner/actions";
import { AdminHeader, StatusBadge } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { loadMedia, loadRelations, toClientDef } from "@/components/admin/loadForm";
import { Button, Field, Input, Notice } from "@/components/ui";
import { accommodationTypes, restaurantTypes } from "@/config/site";
import { requirePartner } from "@/lib/auth/session";
import { partnerListingDef } from "@/lib/partner/def";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function EditPartnerListing({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requirePartner();
  if (!user.accountType) redirect("/partner/activate");
  const supabase = await createClient();
  const { data: row } = await supabase.from("listings").select("*").eq("id", id).eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
  if (!row) notFound();
  const def = partnerListingDef(user.accountType);
  const [relations, media, planRes, roomsRes, menuRes, viewsRes] = await Promise.all([
    loadRelations(def), loadMedia(row.cover_media_id, "listing", id),
    row.plan_id ? supabase.from("subscription_plans").select("name,max_photos,analytics").eq("id", row.plan_id).maybeSingle() : supabase.from("subscription_plans").select("name,max_photos,analytics").eq("slug", "free").maybeSingle(),
    accommodationTypes.includes(row.type) ? supabase.from("room_types").select("*").eq("listing_id", id).order("sort_order") : Promise.resolve({ data: [] }),
    restaurantTypes.includes(row.type) ? supabase.from("menu_items").select("*").eq("listing_id", id).order("section") : Promise.resolve({ data: [] }),
    supabase.from("listing_views").select("day,views").eq("listing_id", id).order("day", { ascending: false }).limit(30),
  ]);
  const plan = planRes.data, rooms = roomsRes.data ?? [], menu = menuRes.data ?? [], views = viewsRes.data ?? [];
  const isStay = accommodationTypes.includes(row.type), isFood = restaurantTypes.includes(row.type);
  const today = new Date().toISOString().slice(0, 10);
  const blocked = isStay && rooms.length ? ((await supabase.from("room_blocked_dates").select("room_type_id,day").in("room_type_id", rooms.map((r: { id: string }) => r.id)).gte("day", today).order("day").limit(60)).data ?? []) : [];
  const kind = isStay ? "rooms" : "menu";

  return (
    <>
      <AdminHeader title={row.name} actions={<StatusBadge value={row.status} />} />
      {sp.child === "invalid" && <div className="mb-4"><Notice tone="error">Enter a name and a valid price.</Notice></div>}
      {row.status === "published" && <div className="mb-4"><Notice tone="info">This listing is live. If you save changes it will go back to <strong>pending review</strong> and be hidden until our team approves the update.</Notice></div>}
      {row.status === "pending_review" && <div className="mb-4"><Notice tone="info">Awaiting review by our team.</Notice></div>}
      <section aria-label="Verification" className="mb-6 rounded-2xl border border-line bg-white p-5 text-sm">
        <h2 className="font-serif text-lg font-semibold text-forest">Verification</h2>
        {sp.verification === "requested" && <div className="mt-2"><Notice tone="success">Verification requested. Our team will check your details.</Notice></div>}
        {sp.verification === "error" && <div className="mt-2"><Notice tone="error">That did not work. Please try again.</Notice></div>}
        {row.verification_decision === "verified" && <p className="mt-2">Your business is <strong>verified</strong>. The badge appears on your public listing.</p>}
        {row.verification_decision === "suspended" && <p className="mt-2 text-red-700">This listing is <strong>suspended</strong>.{row.verification_reason && <> Reason: {row.verification_reason}</>} Please contact the team.</p>}
        {row.verification_decision === "rejected" && <p className="mt-2">Verification was <strong>not approved</strong>.{row.verification_reason && <> Reason: {row.verification_reason}</>} Fix the details, then ask again.</p>}
        {row.verification_decision === "pending" && row.verification_requested_at && <p className="mt-2">Verification requested on {new Date(row.verification_requested_at).toLocaleDateString("en-GB")}. Waiting for our team.</p>}
        {(row.verification_decision === "rejected" || (row.verification_decision === "pending" && !row.verification_requested_at)) && (
          <form action={requestVerification.bind(null, id)} className="mt-3"><Button size="sm" variant="outline">Request verification</Button></form>
        )}
        <p className="mt-3 text-xs text-muted">Verification is a check by our team that your business and details are genuine. A paid plan never verifies a business.</p>
      </section>
      <ResourceForm def={toClientDef(def)} id={id} initial={row} relations={relations} isAdmin={false} cover={media.cover} gallery={media.gallery}
        customAction={savePartnerListing.bind(null, id)} uploadFolder={`partners/${user.id}`} cancelHref="/partner/listings" partner maxGallery={plan?.max_photos ?? 3} />

      {(isStay || isFood) && (
        <section className="mt-10 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="mb-4 font-serif text-lg font-semibold text-forest">{isStay ? "Room types" : "Menu"}</h2>
          <p className="mb-3 text-xs text-muted">Changes here are not reviewed separately. Only add prices you can honour.</p>
          <ul className="mb-5 divide-y divide-line text-sm">
            {(isStay ? rooms : menu).length === 0 && <li className="py-2 text-muted">Nothing added yet.</li>}
            {(isStay ? rooms : menu).map((r: Record<string, string | number | null>) => (
              <li key={String(r.id)} className="flex items-center justify-between gap-3 py-2.5">
                <span><strong>{r.name}</strong>{(r.price_per_night ?? r.price) != null && <> · {formatPrice(Number(r.price_per_night ?? r.price))}</>}</span>
                <form action={partnerDeleteChild.bind(null, kind, String(r.id), id)}><Button size="sm" variant="ghost">Remove</Button></form>
              </li>
            ))}
          </ul>
          <form action={partnerAddChild.bind(null, kind, id)} className="grid gap-3 sm:grid-cols-4">
            <Field label={isStay ? "Room name" : "Dish name"} htmlFor="c-name" className="sm:col-span-2"><Input id="c-name" name="name" required maxLength={200} /></Field>
            {isFood && <Field label="Section" htmlFor="c-section"><Input id="c-section" name="section" placeholder="Mains" maxLength={80} /></Field>}
            {isStay && <Field label="Max guests" htmlFor="c-guests"><Input id="c-guests" name="max_guests" type="number" min={1} /></Field>}
            <Field label={isStay ? "Price per night (GHS)" : "Price (GHS)"} htmlFor="c-price"><Input id="c-price" name="price" type="number" min={0} step="any" /></Field>
            <Field label="Description" htmlFor="c-desc" className="sm:col-span-3"><Input id="c-desc" name="description" maxLength={1000} /></Field>
            <div className="flex items-end"><Button type="submit">Add</Button></div>
          </form>
        </section>
      )}

      {isStay && rooms.length > 0 && (
        <section className="mt-10 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="mb-1 font-serif text-lg font-semibold text-forest">Availability</h2>
          <p className="mb-4 text-sm text-muted">Block dates when a room cannot be booked. Visitors cannot request a blocked room for those dates. Confirmed bookings also use up a room&apos;s units automatically.</p>
          {sp.avail === "invalid" && <div className="mb-3"><Notice tone="error">Choose a room and valid dates (up to a year).</Notice></div>}
          {sp.avail === "saved" && <div className="mb-3"><Notice tone="success">Availability updated.</Notice></div>}
          <form action={blockDates.bind(null, id)} className="grid gap-3 sm:grid-cols-4">
            <div><label htmlFor="av-room" className="mb-1.5 block text-sm font-medium">Room</label><select id="av-room" name="room_type_id" className="h-11 w-full rounded-lg border border-line px-3 text-sm">{rooms.map((r: { id: string; name: string }) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
            <Field label="From" htmlFor="av-from"><Input id="av-from" name="from" type="date" min={today} required /></Field>
            <Field label="To (inclusive)" htmlFor="av-to"><Input id="av-to" name="to" type="date" min={today} /></Field>
            <div className="flex items-end"><Button type="submit">Block dates</Button></div>
          </form>
          {blocked.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2 text-sm">
              {blocked.map((b: { room_type_id: string; day: string }) => (
                <li key={`${b.room_type_id}${b.day}`}><form action={unblockDate.bind(null, id, b.room_type_id, b.day)}>
                  <button className="rounded-full border border-line px-3 py-1 hover:bg-red-50" aria-label={`Unblock ${b.day} for ${rooms.find((r: { id: string }) => r.id === b.room_type_id)?.name}`}>{rooms.find((r: { id: string }) => r.id === b.room_type_id)?.name} · {b.day} ×</button></form></li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="mt-10 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="mb-3 font-serif text-lg font-semibold text-forest">Listing performance</h2>
        <p className="text-sm">Page views, last 30 days: <strong>{views.reduce((a, v) => a + v.views, 0)}</strong></p>
        {plan?.analytics ? (
          <table className="mt-3 w-full max-w-sm text-sm"><thead className="text-left text-xs uppercase text-muted"><tr><th className="py-1">Day</th><th className="py-1">Views</th></tr></thead>
            <tbody>{views.map((v) => <tr key={v.day}><td className="py-1">{v.day}</td><td>{v.views}</td></tr>)}</tbody></table>
        ) : <p className="mt-2 text-xs text-muted">Daily breakdown is part of plans with advanced analytics.</p>}
      </section>
    </>
  );
}
