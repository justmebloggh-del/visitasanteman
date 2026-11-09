import "server-only";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "super_admin" | "admin" | "editor" | "partner" | "visitor";

export interface SessionUser {
  id: string;
  email: string | undefined;
  role: AppRole;
}

/**
 * The role is always read from the database (user_roles), never from the
 * browser, a cookie value or JWT metadata that a user could influence.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();
  return { id: data.user.id, email: data.user.email, role: (roleRow?.role as AppRole) ?? "visitor" };
}

const STAFF: AppRole[] = ["super_admin", "admin", "editor"];
const ADMINS: AppRole[] = ["super_admin", "admin"];

export const isStaff = (r?: AppRole) => !!r && STAFF.includes(r);
export const isAdmin = (r?: AppRole) => !!r && ADMINS.includes(r);

export async function requireStaff(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!isStaff(user.role)) redirect("/?error=forbidden");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireStaff();
  if (!isAdmin(user.role)) redirect("/admin?error=forbidden");
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireStaff();
  if (user.role !== "super_admin") redirect("/admin?error=forbidden");
  return user;
}

export async function requirePartner(): Promise<SessionUser & { accountType: import("@/config/site").BusinessAccountType | null }> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/partner/dashboard");
  if (user.role !== "partner") redirect("/partner");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("business_account_type").eq("id", user.id).maybeSingle();
  return { ...user, accountType: (data?.business_account_type as never) ?? null };
}
