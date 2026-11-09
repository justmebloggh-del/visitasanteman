import type { Metadata } from "next";
import { PartnerNav } from "@/components/partner/PartnerNav";
import { requirePartner } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Partner portal", template: "%s | Partner portal" }, robots: { index: false, follow: false } };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requirePartner();     // authoritative: role read from the database
  return (
    <div className="bg-mist">
      <PartnerNav />
      <div className="mx-auto max-w-6xl p-4 sm:p-8">{children}</div>
    </div>
  );
}
