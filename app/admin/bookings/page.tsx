import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/ui";
import { ManageBookings } from "@/components/bookings/ManageBookings";
import { isAdmin, requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Bookings" };

export default async function AdminBookings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireStaff();
  return (
    <>
      <AdminHeader title="Bookings" intro="All booking requests. Nothing is confirmed automatically; a provider or staff member confirms and sets the price." />
      <ManageBookings back="/admin/bookings" canRefund={isAdmin(user.role)} sp={await searchParams} />
    </>
  );
}
