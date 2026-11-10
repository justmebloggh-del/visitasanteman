import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { loadRelations, loadThemes, toClientDef } from "@/components/admin/loadForm";
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
  if (def.table === "institutions") Object.assign(initial, { verification_status: "awaiting_verification", kind: "other", visitor_access: "unknown" });
  if (def.table === "sports_venues" || def.table === "transport_providers") Object.assign(initial, { verification_status: "awaiting_verification", facility_status: "unknown", ...(def.table === "transport_providers" ? { kind: "other" } : {}) });
  if (def.table === "sports_clubs") initial.verification_status = "awaiting_verification";
  if (def.key === "ceremonies") Object.assign(initial, { verification_status: "awaiting_verification", attendance: "unknown", kind: "ceremony" });
  if (def.table === "listings") initial.verification_decision = "pending";
  if (def.key === "themes") Object.assign(initial, { is_active: true, kind: "experience_theme" });
  if (def.key === "quick-links") Object.assign(initial, { is_enabled: true, icon: "compass" });
  if (def.key === "attraction-categories") initial.is_featured = true;
  if (def.key === "events") Object.assign(initial, { event_status: "scheduled", category: "general" });
  if (def.key === "investments") Object.assign(initial, { stage: "proposed", investment_currency: "GHS", images_are_conceptual: true });
  return (
    <>
      <AdminHeader title={`New ${def.singular}`} intro="Items stay hidden from the public until their status is set to Published." />
      <ResourceForm def={toClientDef(def)} id={null} initial={initial} relations={await loadRelations(def)} themes={await loadThemes(def)} isAdmin={isAdmin(user.role)} canApprove={canApprove(user.role)} cover={[]} gallery={[]} />
    </>
  );
}
