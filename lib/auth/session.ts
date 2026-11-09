import "server-only";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "super_admin" | "admin" | "regional_editor" | "editor" | "media_manager" | "partner" | "visitor";

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

// Mirrors the database helpers is_staff(), is_admin(), can_approve(), can_manage_media().
// These only decide what the interface offers; Row Level Security is the real control.
const STAFF: AppRole[] = ["super_admin", "admin", "regional_editor", "editor"];
const ADMINS: AppRole[] = ["super_admin", "admin"];
const APPROVERS: AppRole[] = ["super_admin", "admin", "regional_editor"];

export const isStaff = (r?: AppRole) => !!r && STAFF.includes(r);
export const isAdmin = (r?: AppRole) => !!r && ADMINS.includes(r);
export const canApprove = (r?: AppRole) => !!r && APPROVERS.includes(r);
export const canManageMedia = (r?: AppRole) => !!r && (STAFF.includes(r) || r === "media_manager");

export async function requireStaff(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!isStaff(user.role)) redirect("/?error=forbidden");
  return user;
}

/** Admin area entry: staff, or a media manager (who only sees the media library). */
export async function requireAdminArea(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!canManageMedia(user.role)) redirect("/?error=forbidden");
  return user;
}

export async function requireMediaAccess(): Promise<SessionUser> {
  const user = await requireAdminArea();
  return user;
}

/** Regional editors, administrators and super administrators. */
export async function requireApprover(): Promise<SessionUser> {
  const user = await requireStaff();
  if (!canApprove(user.role)) redirect("/admin?error=forbidden");
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
