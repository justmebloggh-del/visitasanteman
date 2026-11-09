"use client";

import { useActionState } from "react";
import { lookupBooking, type LookupState } from "@/app/actions/bookings";
import { BookingCard } from "@/components/bookings/BookingCard";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice } from "@/components/ui";

export function LookupForm({ paymentsOn }: { paymentsOn: boolean }) {
  const [state, action] = useActionState<LookupState, FormData>(lookupBooking, {});
  return (
    <div className="space-y-6">
      <form action={action} onReset={(e) => e.preventDefault()} noValidate className="grid gap-4 sm:grid-cols-3 sm:items-end">
        <Field label="Booking reference" htmlFor="reference"><Input id="reference" name="reference" placeholder="VLB-XXXXXXXX" required autoCapitalize="characters" /></Field>
        <Field label="Email used for the booking" htmlFor="lookup-email"><Input id="lookup-email" name="email" type="email" required /></Field>
        <SubmitButton pendingText="Searching…">Find my booking</SubmitButton>
      </form>
      {state.message && !state.booking && <Notice tone="error">{state.message}</Notice>}
      {state.booking && state.email && <BookingCard key={state.booking.id} initial={state.booking} email={state.email} paymentsOn={paymentsOn} />}
    </div>
  );
}
