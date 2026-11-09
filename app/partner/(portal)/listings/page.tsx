import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { archivePartnerListing } from "@/app/partner/actions";
import { AdminHeader, StatusBadge } from "@/components/admin/ui";
import { Button, ButtonLink, Notice } from "@/components/ui";
import { listingTypeLabels, type ListingType } from "@/config/site";
import { requirePartner } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My listings" };

export default async function PartnerListings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePartner();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("id,name,type,status,is_verified,slug").eq("owner_id", user.id).is("deleted_at", null).order("updated_at", { ascending: false });
  return (
    <>
      <AdminHeader title="My listings" actions={<ButtonLink href="/partner/listings/new"><Plus className="size-4" aria-hidden />New listing</ButtonLink>} />
      {sp.saved && <div className="mb-4"><Notice tone="success">Saved.</Notice></div>}
      {sp.submitted && <div className="mb-4"><Notice tone="success">Submitted. Our team will review it and contact you if anything is needed.</Notice></div>}
      <ul className="space-y-3">
        {(data ?? []).length === 0 && <li className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">No listings yet.</li>}
        {(data ?? []).map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
            <div><Link href={`/partner/listings/${l.id}`} className="font-semibold text-forest hover:underline">{l.name}</Link>
              <p className="text-xs text-muted">{listingTypeLabels[l.type as ListingType]}{l.is_verified ? " · Verified" : ""}</p></div>
            <div className="flex items-center gap-2"><StatusBadge value={l.status} />
              <ButtonLink href={`/partner/listings/${l.id}`} size="sm" variant="outline">Edit</ButtonLink>
              {l.status !== "archived" && <form action={archivePartnerListing.bind(null, l.id)}><Button size="sm" variant="ghost">Archive</Button></form>}</div>
          </li>
        ))}
      </ul>
    </>
  );
}
