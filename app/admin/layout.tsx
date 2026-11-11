import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminArea } from "@/lib/auth/session";

// Admin pages are per-user and must never be prerendered or cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminArea();       // authoritative check: role is read from the database
  return (
    <div data-portal className="flex min-h-[calc(100vh-4rem)] flex-col bg-mist md:flex-row">
      <AdminNav role={user.role} />
      <div className="min-w-0 flex-1 p-4 sm:p-8">{children}</div>
    </div>
  );
}
