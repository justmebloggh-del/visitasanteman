import { manageBooking } from "@/app/actions/booking-manage";
import { StatusBadge } from "@/components/admin/ui";
import { Pagination } from "@/components/layout/blocks";
import { Button, ButtonLink, Input, Notice } from "@/components/ui";
import { statusLabels } from "@/lib/bookings";
import { paymentsEnabled } from "@/lib/payments/paystack";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/utils";

const PER = 15;
type Row = {
  id: string; reference: string; kind: string; status: string; payment_status: string; guests: number; notes: string | null;
  customer_name: string; customer_email: string; customer_phone: string | null; total_amount: number | null; currency: string;
  commission_amount: number | null; check_in: string | null; check_out: string | null; booking_date: string | null; booking_time: string | null;
  cancellation_reason: string | null; cancelled_by: string | null; created_at: string;
  listing: { name: string } | null; experience: { title: string } | null; room: { name: string } | null;
  payments: { reference: string; status: string; amount: number; method: string | null }[];
};

/** Rows come back through RLS, so a provider sees only their own bookings and staff see all. */
export async function ManageBookings({ back, canRefund, sp }: { back: string; canRefund: boolean; sp: Record<string, string | undefined> }) {
  const supabase = await createClient();
  const page = Math.max(1, Number(sp.page) || 1);
  let q = supabase.from("bookings")
    .select("*, listing:listing_id(name), experience:experience_id(title), room:room_type_id(name), payments:booking_payments(reference,status,amount,method)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (sp.status) q = q.eq("status", sp.status);
  const { data, count } = await q.range((page - 1) * PER, page * PER - 1);
  const rows = (data ?? []) as unknown as Row[];
  const payOn = paymentsEnabled();

  return (
    <>
      {sp.saved && <div className="mb-4"><Notice tone="success">Booking updated and the customer was emailed (if email is configured).</Notice></div>}
      {sp.error && <div className="mb-4"><Notice tone="error">{sp.error}</Notice></div>}
      <nav className="mb-5 flex flex-wrap gap-2 text-sm" aria-label="Filter by status">
        <ButtonLink href={back} size="sm" variant={!sp.status ? "primary" : "outline"}>All</ButtonLink>
        {Object.entries(statusLabels).map(([k, l]) => <ButtonLink key={k} href={`${back}?status=${k}`} size="sm" variant={sp.status === k ? "primary" : "outline"}>{l}</ButtonLink>)}
      </nav>
      <ul className="space-y-4">
        {rows.length === 0 && <li className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">No bookings.</li>}
        {rows.map((b) => {
          const act = (status: string) => manageBooking.bind(null, b.id, status, back);
          const when = b.kind === "accommodation" ? `${formatDate(b.check_in!)} to ${formatDate(b.check_out!)}` : `${formatDate(b.booking_date!)}${b.booking_time ? ` ${b.booking_time.slice(0, 5)}` : ""}`;
          const open = ["pending", "confirmed", "awaiting_payment", "paid"].includes(b.status);
          return (
            <li key={b.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-mono text-xs text-muted">{b.reference} · {b.kind}</p>
                  <h2 className="font-semibold text-forest">{b.listing?.name ?? b.experience?.title}{b.room ? ` · ${b.room.name}` : ""}</h2></div>
                <StatusBadge value={b.status} />
              </div>
              <p className="mt-1 text-sm">{when} · {b.guests} guest{b.guests > 1 ? "s" : ""}{b.total_amount != null && <> · <strong>{formatPrice(Number(b.total_amount), b.currency)}</strong></>}{b.commission_amount != null && <span className="text-muted"> (commission {formatPrice(Number(b.commission_amount), b.currency)})</span>}</p>
              <p className="text-sm"><strong>{b.customer_name}</strong> · <a className="text-lake-dark underline underline-offset-2 hover:no-underline" href={`mailto:${b.customer_email}`}>{b.customer_email}</a>{b.customer_phone && <> · {b.customer_phone}</>}</p>
              {b.notes && <p className="mt-2 whitespace-pre-line text-sm text-ink/80">{b.notes}</p>}
              {b.cancellation_reason && <p className="mt-2 text-sm text-red-700">Cancelled by {b.cancelled_by}: {b.cancellation_reason}</p>}
              {b.payments.length > 0 && <p className="mt-2 text-xs text-muted">Payments: {b.payments.map((p) => `${p.reference} ${p.status}${p.method ? ` (${p.method})` : ""}`).join("; ")}</p>}

              {(open || (canRefund && b.payment_status === "paid" && b.status !== "refunded")) && (
                <form className="mt-4 flex flex-wrap items-end gap-2">
                  {["pending", "confirmed"].includes(b.status) && (
                    <label className="text-xs text-muted">Price (GHS)<Input name="amount" type="number" min="1" step="0.01" defaultValue={b.total_amount ?? ""} className="mt-1 h-9 w-32" /></label>
                  )}
                  {open && <label className="text-xs text-muted">Reason (needed to cancel)<Input name="reason" maxLength={500} className="mt-1 h-9 w-56" /></label>}
                  <div className="flex flex-wrap gap-2">
                    {b.status === "pending" && <Button size="sm" formAction={act("confirmed")}>Confirm</Button>}
                    {b.status === "confirmed" && payOn && <Button size="sm" formAction={act("awaiting_payment")}>Request online payment</Button>}
                    {(b.status === "confirmed" || b.status === "paid") && <Button size="sm" variant="outline" formAction={act("completed")}>Mark completed</Button>}
                    {open && <Button size="sm" variant="danger" formAction={act("cancelled")}>Cancel</Button>}
                    {canRefund && b.payment_status === "paid" && ["paid", "cancelled", "completed"].includes(b.status) && <Button size="sm" variant="outline" formAction={act("refunded")}>Record refund</Button>}
                  </div>
                </form>
              )}
              {b.status === "confirmed" && !payOn && <p className="mt-2 text-xs text-muted">Online payment is off. Arrange payment with the customer directly, then mark completed after the stay.</p>}
              {canRefund && b.payment_status === "paid" && <p className="mt-2 text-xs text-muted">“Record refund” only records it. Return the money through the Paystack dashboard first.</p>}
            </li>
          );
        })}
      </ul>
      <Pagination page={page} pageCount={Math.max(1, Math.ceil((count ?? 0) / PER))} basePath={back} params={{ status: sp.status }} />
    </>
  );
}
