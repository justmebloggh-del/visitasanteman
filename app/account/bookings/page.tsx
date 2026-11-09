import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingCard } from "@/components/bookings/BookingCard";
import { PageHeader } from "@/components/layout/blocks";
import { Container } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import type { BookingRow } from "@/lib/bookings";
import { paymentsEnabled } from "@/lib/payments/paystack";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My bookings", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyBookings() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/bookings");
  const supabase = await createClient();
  // RLS returns only this user's bookings. lookup_booking supplies the display-ready row.
  const { data: mine } = await supabase.from("bookings").select("reference,customer_email").order("created_at", { ascending: false }).limit(50);
  const rows = await Promise.all((mine ?? []).map(async (m) => ({ email: m.customer_email, row: ((await supabase.rpc("lookup_booking", { p_ref: m.reference, p_email: m.customer_email })).data as BookingRow[] | null)?.[0] })));
  return (
    <>
      <PageHeader title="My bookings" crumbs={[{ label: "My bookings" }]} />
      <Container className="max-w-3xl space-y-5 py-10">
        {rows.length === 0 && <p className="rounded-2xl bg-mist p-8 text-center text-muted">No bookings yet. Bookings you make while signed in appear here.</p>}
        {rows.filter((r) => r.row).map((r) => <BookingCard key={r.row!.id} initial={r.row!} email={r.email} paymentsOn={paymentsEnabled()} />)}
      </Container>
    </>
  );
}
