import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { addChild, deleteChild } from "@/app/admin/actions";
import { AdminHeader, Flash, StatusBadge } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { loadMedia, loadRelations, toClientDef } from "@/components/admin/loadForm";
import { Button, Field, Input, Notice } from "@/components/ui";
import { resourceMap } from "@/config/admin-resources";
import { canApprove, isAdmin, requireApprover, requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function EditResource({ params, searchParams }: { params: Promise<{ resource: string; id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { resource, id } = await params;
  const def = resourceMap[resource];
  if (!def) notFound();
  const user = def.approverOnly ? await requireApprover() : await requireStaff();
  const sp = await searchParams;
  const supabase = await createClient();

  let q = supabase.from(def.table).select("*").eq(def.slugField ?? "id", id);
  if (def.typeFilter) q = q.in(def.typeFilter.column, def.typeFilter.values);
  const { data: row } = await q.maybeSingle();
  if (!row) notFound();

  const rowId = String(row[def.slugField ?? "id"]);
  const [relations, media] = await Promise.all([
    loadRelations(def),
    loadMedia(row.cover_media_id ?? null, def.galleryEntity, def.slugField ? undefined : rowId),
  ]);

  const here = `/admin/${def.key}/${rowId}`;
  const rooms = def.children === "rooms" ? (await supabase.from("room_types").select("*").eq("listing_id", rowId).order("sort_order")).data ?? [] : [];
  const menu = def.children === "menu" ? (await supabase.from("menu_items").select("*").eq("listing_id", rowId).order("section").order("sort_order")).data ?? [] : [];
  const publicHref = def.publicPath && row.status === "published" ? def.publicPath(row) : null;

  return (
    <>
      <AdminHeader title={String(row[def.titleField] ?? `Edit ${def.singular}`)} intro={`Editing ${def.singular}`}
        actions={<>{def.hasStatus && <StatusBadge value={String(row.status)} />}{publicHref && <Link href={publicHref} target="_blank" className="inline-flex items-center gap-1 text-sm text-lake-dark underline underline-offset-2 hover:no-underline">View live<ExternalLink className="size-3.5" aria-hidden /></Link>}</>} />
      <Flash sp={sp} />
      {row.deleted_at && <div className="mb-4"><Notice tone="error">This item has been deleted (archived). Saving will not restore it.</Notice></div>}
      <ResourceForm def={toClientDef(def)} id={rowId} initial={row} relations={relations} isAdmin={isAdmin(user.role)} canApprove={canApprove(user.role)} cover={media.cover} gallery={media.gallery} />

      {def.children === "rooms" && (
        <section className="mt-10 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="mb-1 font-serif text-lg font-semibold text-forest">Room types</h2>
          <p className="mb-4 text-sm text-muted">Prices are indicative. Real-time availability arrives with the booking phase.</p>
          {sp.child === "invalid" && <div className="mb-3"><Notice tone="error">Enter a name and a valid price.</Notice></div>}
          <ul className="mb-5 divide-y divide-line">
            {rooms.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span><strong>{r.name}</strong>{r.price_per_night != null && <> · {formatPrice(r.price_per_night)}/night</>}{r.max_guests && <> · up to {r.max_guests}</>}</span>
                <form action={deleteChild.bind(null, "rooms", r.id, here)}><Button size="sm" variant="ghost" aria-label={`Remove ${r.name}`}>Remove</Button></form>
              </li>
            ))}
            {rooms.length === 0 && <li className="py-2 text-sm text-muted">No rooms added yet.</li>}
          </ul>
          <form action={addChild.bind(null, "rooms", rowId, here)} className="grid gap-3 sm:grid-cols-4">
            <Field label="Room name" htmlFor="room-name" className="sm:col-span-2"><Input id="room-name" name="name" required maxLength={200} /></Field>
            <Field label="Price per night (GHS)" htmlFor="room-price"><Input id="room-price" name="price" type="number" min={0} step="any" /></Field>
            <Field label="Max guests" htmlFor="room-guests"><Input id="room-guests" name="max_guests" type="number" min={1} /></Field>
            <Field label="Description" htmlFor="room-desc" className="sm:col-span-3"><Input id="room-desc" name="description" maxLength={1000} /></Field>
            <div className="flex items-end"><Button type="submit">Add room</Button></div>
          </form>
        </section>
      )}

      {def.children === "menu" && (
        <section className="mt-10 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="mb-1 font-serif text-lg font-semibold text-forest">Menu</h2>
          <p className="mb-4 text-sm text-muted">Add only dishes and prices the restaurant has confirmed.</p>
          {sp.child === "invalid" && <div className="mb-3"><Notice tone="error">Enter a name and a valid price.</Notice></div>}
          <ul className="mb-5 divide-y divide-line">
            {menu.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span><strong>{m.name}</strong> <span className="text-muted">({m.section})</span>{m.price != null && <> · {formatPrice(m.price)}</>}</span>
                <form action={deleteChild.bind(null, "menu", m.id, here)}><Button size="sm" variant="ghost" aria-label={`Remove ${m.name}`}>Remove</Button></form>
              </li>
            ))}
            {menu.length === 0 && <li className="py-2 text-sm text-muted">No menu items yet.</li>}
          </ul>
          <form action={addChild.bind(null, "menu", rowId, here)} className="grid gap-3 sm:grid-cols-4">
            <Field label="Dish name" htmlFor="menu-name" className="sm:col-span-2"><Input id="menu-name" name="name" required maxLength={200} /></Field>
            <Field label="Section" htmlFor="menu-section"><Input id="menu-section" name="section" placeholder="Mains" maxLength={80} /></Field>
            <Field label="Price (GHS)" htmlFor="menu-price"><Input id="menu-price" name="price" type="number" min={0} step="any" /></Field>
            <Field label="Description" htmlFor="menu-desc" className="sm:col-span-3"><Input id="menu-desc" name="description" maxLength={1000} /></Field>
            <div className="flex items-end"><Button type="submit">Add item</Button></div>
          </form>
        </section>
      )}

      {def.revisions && <Revisions table={def.table} recordId={rowId} />}
    </>
  );
}

/** Read-only history: the previous version of the row each time it changed. */
async function Revisions({ table, recordId }: { table: string; recordId: string }) {
  const supabase = await createClient();
  const { data } = await supabase.from("content_revisions").select("id,created_at,changed_by,snapshot")
    .eq("table_name", table).eq("record_id", recordId).order("created_at", { ascending: false }).limit(15);
  const ids = Array.from(new Set((data ?? []).map((r) => r.changed_by).filter(Boolean)));
  const { data: people } = ids.length ? await supabase.from("profiles").select("id,full_name,email").in("id", ids) : { data: [] };
  const name = (id: string | null) => { const p = (people ?? []).find((x) => x.id === id); return p ? p.full_name || p.email : "system"; };
  return (
    <section className="mt-10 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h2 className="mb-1 font-serif text-lg font-semibold text-forest">Revision history</h2>
      <p className="mb-4 text-sm text-muted">Each entry is the version that was replaced by a later save.</p>
      {(data ?? []).length === 0 ? <p className="text-sm text-muted">No earlier versions yet.</p> : (
        <ul className="divide-y divide-line text-sm">
          {data!.map((r) => {
            const s = r.snapshot as Record<string, unknown>;
            return (
              <li key={r.id} className="py-2.5">
                <span className="font-medium">{formatDate(r.created_at, true)}</span> by {name(r.changed_by)}
                <span className="text-muted"> · was “{String(s.name ?? s.title ?? "")}”, status {String(s.status ?? "n/a").replace("_", " ")}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
