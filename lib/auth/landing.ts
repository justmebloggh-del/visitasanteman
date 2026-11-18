import { canManageMedia, isStaff, type AppRole } from "@/lib/auth/session";

/** Where a signed-in person starts: staff in the admin, business partners in their portal, everyone else in their own account. */
export function landingPath(role?: AppRole): string {
  if (isStaff(role) || canManageMedia(role)) return "/admin";
  if (role === "partner") return "/partner/dashboard";
  return "/account";
}
