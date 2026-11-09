"use client";

import { useActionState } from "react";
import { cancelMyBooking, payForBooking, reviewMyBooking, type LookupState } from "@/app/actions/bookings";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Badge, Field, Input, Notice, Select, Textarea } from "@/components/ui";
import { statusHelp, statusLabels, type BookingRow } from "@/lib/bookings";
import { formatDate, formatPrice } from "@/lib/utils";

const tone = { pending: "gold", confirmed: "green", awaiting_payment: "blue", paid: "green", cancelled: "red", completed: "green", refunded: "neutral" } as const;

export function BookingCard({ initial, email, paymentsOn }: { initial: BookingRow; email: string; paymentsOn: boolean }) {
  const [cancelState, cancelAction] = useActionState<LookupState, FormData>(cancelMyBooking.bind(null, initial.reference, email), { booking: initial });
  const [reviewState, reviewAction] = useActionState<LookupState, FormData>(reviewMyBooking.bind(null, initial.reference, email), { booking: initial });
  // Whichever action ran last holds the freshest copy of the booking.
  const b = reviewState.notice || reviewState.message ? reviewState.booking ?? initial : cancelState.booking ?? initial;
  const when = b.kind === "accommodation" ? `${formatDate(b.check_in!)} to ${formatDate(b.check_out!)}` : `${formatDate(b.booking_date!)}${b.booking_time ? ` at ${b.booking_time.slice(0, 5)}` : ""}`;
  const cancellable = ["pending", "confirmed", "awaiting_payment"].includes(b.status);

  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="font-mono text-sm text-muted">{b.reference}</p><h2 className="font-serif text-xl font-semibold text-forest">{b.title ?? "Booking"}</h2></div>
        <Badge tone={tone[b.status as keyof typeof tone] ?? "neutral"}>{statusLabels[b.status] ?? b.status}</Badge>
      </div>
      <p className="mt-1 text-sm text-ink/80">{when} · {b.guests} guest{b.guests > 1 ? "s" : ""}</p>
      {b.total_amount != null && <p className="mt-1 text-sm">Price: <strong>{formatPrice(Number(b.total_amount), b.currency)}</strong>{b.payment_status === "paid" && " (paid)"}</p>}
      <p className="mt-2 text-sm text-muted">{statusHelp[b.status]}</p>

      {(cancelState.notice || reviewState.notice) && <div className="mt-3"><Notice tone="success">{cancelState.notice ?? reviewState.notice}</Notice></div>}
      {(cancelState.message || reviewState.message) && <div className="mt-3"><Notice tone="error">{cancelState.message ?? reviewState.message}</Notice></div>}

      {b.status === "awaiting_payment" && (
        paymentsOn
          ? <form action={payForBooking.bind(null, b.reference, email)} className="mt-4"><SubmitButton pendingText="Redirecting to payment…">Pay {formatPrice(Number(b.total_amount), b.currency)} online</SubmitButton></form>
          : <p className="mt-4 text-sm text-muted">Online payment is not available yet. The provider will tell you how to pay.</p>
      )}

      {cancellable && (
        <form action={cancelAction} onReset={(e) => e.preventDefault()} className="mt-4 flex flex-wrap items-end gap-2">
          <Field label="Reason for cancelling (optional)" htmlFor={`r-${b.id}`} className="min-w-52 flex-1"><Input id={`r-${b.id}`} name="reason" maxLength={500} /></Field>
          <SubmitButton variant="outline" pendingText="Cancelling…">Cancel booking</SubmitButton>
        </form>
      )}

      {b.can_review && (
        <form action={reviewAction} onReset={(e) => e.preventDefault()} className="mt-5 space-y-3 border-t border-line pt-4">
          <h3 className="font-semibold text-forest">How was it?</h3>
          <Field label="Rating" htmlFor={`rt-${b.id}`}><Select id={`rt-${b.id}`} name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} out of 5</option>)}</Select></Field>
          <Field label="Comment (optional)" htmlFor={`rc-${b.id}`}><Textarea id={`rc-${b.id}`} name="comment" rows={3} maxLength={2000} /></Field>
          <SubmitButton pendingText="Sending…">Submit review</SubmitButton>
        </form>
      )}
      {b.reviewed && !reviewState.notice && <p className="mt-4 text-xs text-muted">Thanks, you have reviewed this booking.</p>}
    </article>
  );
}
