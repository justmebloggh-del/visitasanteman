"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireApprover } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// Same rule as the rest of the admin: every action re-checks the role on the server; the database enforces it again.
const done = (tab: string, error: boolean): never => { revalidatePath("/jobs"); revalidatePath("/admin/jobs"); redirect(`/admin/jobs?tab=${tab}&${error ? "error=1" : "saved=1"}`); };

export async function moderateVacancy(id: string, decision: "publish" | "return" | "archive"): Promise<void> {
  await requireApprover();
  const supabase = await createClient();
  const status = decision === "publish" ? "published" : decision === "return" ? "draft" : "archived";
  const { error } = await supabase.from("job_vacancies").update({ status }).eq("id", id);
  if (error) console.error("[admin jobs vacancy]", error.message);      // e.g. a district is required before publishing
  done("vacancies", !!error);
}

export async function decideEmployer(id: string, decision: "verified" | "unverified" | "suspended"): Promise<void> {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const patch = decision === "verified"
    ? { verification_status: "verified", verified_at: new Date().toISOString(), verified_by: admin.id, suspended_reason: null }
    : decision === "suspended" ? { verification_status: "suspended", suspended_reason: "Suspended by an administrator" }
    : { verification_status: "unverified", verified_at: null, verified_by: null, suspended_reason: null };
  const { error } = await supabase.from("employer_profiles").update(patch).eq("id", id);
  if (error) console.error("[admin jobs employer]", error.message);
  done("employers", !!error);
}

export async function resolveReport(id: string, status: "actioned" | "dismissed"): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("job_reports").update({ status }).eq("id", id);
  if (error) console.error("[admin jobs report]", error.message);
  done("reports", !!error);
}
