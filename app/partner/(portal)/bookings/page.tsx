import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/ui";
import { ManageBookings } from "@/components/bookings/ManageBookings";
import { requirePartner } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Bookings" };

export default async function PartnerBookings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePartner();
  return (
    <>
      <AdminHeader title="Bookings" intro="Requests for your listings. Confirm or decline each one and set the price. Customers are emailed when you update them." />
      <ManageBookings back="/partner/bookings" canRefund={false} sp={await searchParams} />
    </>
  );
}
