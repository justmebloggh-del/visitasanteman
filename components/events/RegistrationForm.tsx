"use client";

import { useActionState } from "react";
import { registerForEvent } from "@/app/actions/awards";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice, Textarea } from "@/components/ui";
import type { FormState } from "@/lib/validations/forms";

export function RegistrationForm({ eventId }: { eventId: string }) {
  const [state, action] = useActionState<FormState, FormData>(registerForEvent, {});
  const err = state.errors ?? {};
  if (state.ok) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={action} onReset={(e) => e.preventDefault()} noValidate className="space-y-3">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      <input type="hidden" name="event_id" value={eventId} />
      <Field label="Name" htmlFor="reg-name" error={err.name}><Input id="reg-name" name="name" autoComplete="name" required /></Field>
      <Field label="Email" htmlFor="reg-email" error={err.email}><Input id="reg-email" name="email" type="email" autoComplete="email" required /></Field>
      <Field label="Phone (optional)" htmlFor="reg-phone" error={err.phone}><Input id="reg-phone" name="phone" type="tel" autoComplete="tel" /></Field>
      <Field label="Places (you and your guests)" htmlFor="reg-guests" error={err.guests}><Input id="reg-guests" name="guests" type="number" min={1} max={10} defaultValue={1} required /></Field>
      <Field label="Anything the organiser should know (optional)" htmlFor="reg-notes" error={err.notes}><Textarea id="reg-notes" name="notes" rows={3} maxLength={500} /></Field>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <SubmitButton pendingText="Registering…" className="w-full">Register</SubmitButton>
      <p className="text-xs text-muted">Free registration. This is not a ticket or a payment.</p>
    </form>
  );
}
