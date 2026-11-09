import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { loadRelations, toClientDef } from "@/components/admin/loadForm";
import { resourceMap } from "@/config/admin-resources";
import { canApprove, isAdmin, requireApprover, requireStaff } from "@/lib/auth/session";

export default async function NewResource({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const def = resourceMap[resource];
  if (!def || def.key === "pages") notFound();
  const user = def.approverOnly ? await requireApprover() : await requireStaff();
  const initial: Record<string, unknown> = { status: "draft" };
  if (def.typeFilter && def.typeFilter.values.length === 1) initial[def.typeFilter.column] = def.typeFilter.values[0];
  if (def.key === "regions" || def.key === "administrative-areas") initial.is_active = true;
  if (def.key === "attractions") Object.assign(initial, { verification_status: "awaiting_verification", access_status: "unknown" });
  if (def.key === "events") initial.event_status = "scheduled";
  if (def.key === "investments") Object.assign(initial, { stage: "proposed", investment_currency: "GHS", images_are_conceptual: true });
  return (
    <>
      <AdminHeader title={`New ${def.singular}`} intro="Items stay hidden from the public until their status is set to Published." />
      <ResourceForm def={toClientDef(def)} id={null} initial={initial} relations={await loadRelations(def)} isAdmin={isAdmin(user.role)} canApprove={canApprove(user.role)} cover={[]} gallery={[]} />
    </>
  );
}
