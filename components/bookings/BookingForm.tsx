"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createBookingRequest, type BookingFormState } from "@/app/actions/bookings";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui";

export interface RoomOption { id: string; name: string; price: string | null; maxGuests: number | null }

const today = () => new Date().toISOString().slice(0, 10);

export function BookingForm({ kind, listingId, experienceId, rooms = [], minGuests, maxGuests }: {
  kind: "accommodation" | "experience" | "table"; listingId?: string; experienceId?: string; rooms?: RoomOption[]; minGuests?: number | null; maxGuests?: number | null;
}) {
  const [state, action] = useActionState<BookingFormState, FormData>(createBookingRequest, {});
  const err = state.errors ?? {};

  if (state.ok && state.reference) {
    return (
      <div className="space-y-3">
        <Notice tone="success">Request sent. Your reference is <strong className="font-mono">{state.reference}</strong>.</Notice>
        <p className="text-sm text-muted">This is a <strong>request</strong>, not a confirmed booking. The provider will confirm availability and the price. Keep your reference and check progress any time on the <Link href="/booking" className="text-lake-dark underline">booking status page</Link>.</p>
      </div>
    );
  }

  return (
    <form action={action} onReset={(e) => e.preventDefault()} noValidate className="space-y-4">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      <input type="hidden" name="kind" value={kind} />
      {listingId && <input type="hidden" name="listing_id" value={listingId} />}
      {experienceId && <input type="hidden" name="experience_id" value={experienceId} />}
      {kind === "accommodation" && rooms.length > 0 && (
        <Field label="Room type" htmlFor="room_type_id" error={err.room_type_id}>
          <Select id="room_type_id" name="room_type_id" defaultValue="">
            <option value="">No preference</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}{r.price ? ` (${r.price}/night)` : ""}</option>)}
          </Select>
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {kind === "accommodation" ? (
          <>
            <Field label="Check-in" htmlFor="check_in" error={err.check_in}><Input id="check_in" name="check_in" type="date" min={today()} required /></Field>
            <Field label="Check-out" htmlFor="check_out" error={err.check_out}><Input id="check_out" name="check_out" type="date" min={today()} required /></Field>
          </>
        ) : (
          <>
            <Field label="Date" htmlFor="date" error={err.date}><Input id="date" name="date" type="date" min={today()} required /></Field>
            {kind === "table" && <Field label="Time" htmlFor="time" error={err.time}><Input id="time" name="time" type="time" required /></Field>}
          </>
        )}
        <Field label={kind === "table" ? "Party size" : "Guests"} htmlFor="guests" error={err.guests} hint={minGuests || maxGuests ? `${minGuests ? `Min ${minGuests}` : ""}${minGuests && maxGuests ? ", " : ""}${maxGuests ? `max ${maxGuests}` : ""}` : undefined}>
          <Input id="guests" name="guests" type="number" min={minGuests ?? 1} max={maxGuests ?? 500} defaultValue={minGuests ?? 2} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="b-name" error={err.name}><Input id="b-name" name="name" autoComplete="name" required /></Field>
        <Field label="Email" htmlFor="b-email" error={err.email}><Input id="b-email" name="email" type="email" autoComplete="email" required /></Field>
        <Field label="Phone or WhatsApp (optional)" htmlFor="b-phone" error={err.phone} className="sm:col-span-2"><Input id="b-phone" name="phone" type="tel" autoComplete="tel" /></Field>
      </div>
      <Field label="Notes (optional)" htmlFor="b-notes" error={err.notes}><Textarea id="b-notes" name="notes" rows={3} /></Field>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <SubmitButton className="w-full" pendingText="Sending…">Send booking request</SubmitButton>
      <p className="text-xs text-muted">Nothing is booked or charged yet. The provider confirms availability and price first.</p>
    </form>
  );
}
