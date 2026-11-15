"use client";

import { useActionState } from "react";
import { submitNomination } from "@/app/actions/awards";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui";
import type { FormState } from "@/lib/validations/forms";

export function NominationForm({ programmeId, categories }: { programmeId: string; categories: string[] }) {
  const [state, action] = useActionState<FormState, FormData>(submitNomination, {});
  const err = state.errors ?? {};
  if (state.ok) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={action} onReset={(e) => e.preventDefault()} noValidate className="space-y-4">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      <input type="hidden" name="programme_id" value={programmeId} />
      <Field label="Category" htmlFor="category" error={err.category}>
        <Select id="category" name="category" required defaultValue="">
          <option value="" disabled>Choose a category</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nominee (person or organisation)" htmlFor="nominee_name" error={err.nominee_name}><Input id="nominee_name" name="nominee_name" required maxLength={150} /></Field>
        <Field label="Organisation (optional)" htmlFor="nominee_organisation" error={err.nominee_organisation}><Input id="nominee_organisation" name="nominee_organisation" maxLength={150} /></Field>
        <Field label="Town or district (optional)" htmlFor="nominee_location" error={err.nominee_location}><Input id="nominee_location" name="nominee_location" maxLength={150} /></Field>
        <Field label="Supporting link (optional)" htmlFor="supporting_url" error={err.supporting_url}><Input id="supporting_url" name="supporting_url" type="url" placeholder="https://" maxLength={500} /></Field>
      </div>
      <Field label="Why should this nominee be considered?" htmlFor="reason" error={err.reason} hint="Refer to the evaluation criteria above. Facts we can check are more useful than praise.">
        <Textarea id="reason" name="reason" required maxLength={3000} aria-invalid={!!err.reason} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="nominator_name" error={err.nominator_name}><Input id="nominator_name" name="nominator_name" autoComplete="name" required /></Field>
        <Field label="Your email" htmlFor="nominator_email" error={err.nominator_email}><Input id="nominator_email" name="nominator_email" type="email" autoComplete="email" required /></Field>
        <Field label="Your phone (optional)" htmlFor="nominator_phone" error={err.nominator_phone}><Input id="nominator_phone" name="nominator_phone" type="tel" autoComplete="tel" /></Field>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <SubmitButton pendingText="Sending…">Submit nomination</SubmitButton>
      <p className="text-xs text-muted">Your contact details are used only to follow up on this nomination and are never published.</p>
    </form>
  );
}
