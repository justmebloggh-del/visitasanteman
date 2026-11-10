"use client";

import { useActionState } from "react";
import { applyToVacancy } from "@/app/actions/jobs";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice, Textarea } from "@/components/ui";
import type { FormState } from "@/lib/validations/forms";

export function ApplyForm({ vacancyId, defaultName }: { vacancyId: string; defaultName?: string }) {
  const [state, action] = useActionState<FormState, FormData>(applyToVacancy, {});
  const err = state.errors ?? {};
  if (state.ok) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={action} noValidate className="space-y-4">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      <input type="hidden" name="vacancy_id" value={vacancyId} />
      <Field label="Full name" htmlFor="applicant_name" error={err.applicant_name}><Input id="applicant_name" name="applicant_name" autoComplete="name" required defaultValue={defaultName} aria-invalid={!!err.applicant_name} /></Field>
      <Field label="Phone or WhatsApp (optional)" htmlFor="applicant_phone" error={err.applicant_phone}><Input id="applicant_phone" name="applicant_phone" type="tel" autoComplete="tel" /></Field>
      <Field label="Cover note (optional)" htmlFor="cover_note" error={err.cover_note} hint="Why you are a good fit. Up to 3,000 characters."><Textarea id="cover_note" name="cover_note" rows={5} /></Field>
      <Field label="CV (optional, PDF or Word .docx, up to 5 MB)" htmlFor="cv" error={err.cv}><Input id="cv" name="cv" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" /></Field>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <SubmitButton pendingText="Sending…">Send application</SubmitButton>
      <p className="text-xs text-muted">Your details and CV go only to this employer and our administrators. You can withdraw or delete your application at any time from My applications. Applying is always free.</p>
    </form>
  );
}
