"use client";

import { useActionState } from "react";
import { submitEnquiry } from "@/app/actions/forms";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui";
import type { FormState } from "@/lib/validations/forms";

const kinds = [
  ["general", "General question"],
  ["accommodation", "Accommodation"],
  ["experience", "Tour or experience"],
  ["table_reservation", "Table reservation"],
  ["business_listing", "List my business"],
  ["partnership", "Partnership"],
  ["investment", "Investment"],
] as const;

export function EnquiryForm({ kind = "general", listingId, experienceId, investmentId, subject, showDates, showOrganisation, lockKind }: {
  kind?: string; listingId?: string; experienceId?: string; investmentId?: string; subject?: string; showDates?: boolean; showOrganisation?: boolean; lockKind?: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(submitEnquiry, {});
  const err = state.errors ?? {};

  if (state.ok) {
    return <Notice tone="success">{state.message}</Notice>;
  }

  return (
    <form action={action} onReset={(e) => e.preventDefault()} noValidate className="space-y-4">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      {lockKind ? <input type="hidden" name="kind" value={kind} /> : (
        <Field label="What is this about?" htmlFor="kind">
          <Select id="kind" name="kind" defaultValue={kind}>
            {kinds.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
      )}
      {listingId && <input type="hidden" name="listing_id" value={listingId} />}
      {experienceId && <input type="hidden" name="experience_id" value={experienceId} />}
      {investmentId && <input type="hidden" name="investment_id" value={investmentId} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" error={err.name}><Input id="name" name="name" autoComplete="name" required aria-invalid={!!err.name} /></Field>
        <Field label="Email" htmlFor="email" error={err.email}><Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!err.email} /></Field>
        <Field label="Phone or WhatsApp (optional)" htmlFor="phone" error={err.phone}><Input id="phone" name="phone" type="tel" autoComplete="tel" /></Field>
        {showOrganisation && <Field label="Organisation (optional)" htmlFor="organisation" error={err.organisation}><Input id="organisation" name="organisation" autoComplete="organization" /></Field>}
        {showDates && <Field label="Guests" htmlFor="guests" error={err.guests}><Input id="guests" name="guests" type="number" min={1} max={500} /></Field>}
        {showDates && <Field label="From" htmlFor="date_from"><Input id="date_from" name="date_from" type="date" /></Field>}
        {showDates && <Field label="To" htmlFor="date_to"><Input id="date_to" name="date_to" type="date" /></Field>}
      </div>
      <Field label="Message" htmlFor="message" error={err.message}>
        <Textarea id="message" name="message" required defaultValue={subject ? `Hello, I would like to ask about ${subject}.\n\n` : ""} aria-invalid={!!err.message} />
      </Field>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <SubmitButton pendingText="Sending…">Send message</SubmitButton>
      <p className="text-xs text-muted">This is an enquiry, not a confirmed booking. The provider or our team will reply to confirm availability and price.</p>
    </form>
  );
}
