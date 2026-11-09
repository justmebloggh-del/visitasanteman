import { redirect } from "next/navigation";
import { savePartnerListing } from "@/app/partner/actions";
import { AdminHeader } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { loadRelations, toClientDef } from "@/components/admin/loadForm";
import { requirePartner } from "@/lib/auth/session";
import { partnerListingDef } from "@/lib/partner/def";
import { createClient } from "@/lib/supabase/server";

export default async function NewPartnerListing() {
  const user = await requirePartner();
  if (!user.accountType) redirect("/partner/activate");
  const def = partnerListingDef(user.accountType);
  const { data: plan } = await (await createClient()).from("subscription_plans").select("max_photos").eq("slug", "free").maybeSingle();
  const types = def.typeFilter!.values;
  const initial: Record<string, unknown> = types.length === 1 ? { type: types[0] } : {};
  return (
    <>
      <AdminHeader title="New listing" intro="Save a draft any time. When you submit, our team reviews it before it is published." />
      <ResourceForm def={toClientDef(def)} id={null} initial={initial} relations={await loadRelations(def)} isAdmin={false} cover={[]} gallery={[]}
        customAction={savePartnerListing.bind(null, null)} uploadFolder={`partners/${user.id}`} cancelHref="/partner/listings" partner maxGallery={plan?.max_photos ?? 3} />
    </>
  );
}
