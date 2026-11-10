"use client";

import { useActionState } from "react";
import { reportVacancy } from "@/app/actions/jobs";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Notice, Select, Textarea } from "@/components/ui";
import { reportReasons } from "@/config/jobs";
import type { FormState } from "@/lib/validations/forms";

export function ReportForm({ vacancyId }: { vacancyId: string }) {
  const [state, action] = useActionState<FormState, FormData>(reportVacancy, {});
  if (state.ok) return <Notice tone="success">{state.message}</Notice>;
  const err = state.errors ?? {};
  return (
    <form action={action} noValidate className="space-y-3">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      <input type="hidden" name="vacancy_id" value={vacancyId} />
      <Field label="Reason" htmlFor="reason" error={err.reason}>
        <Select id="reason" name="reason" defaultValue="">
          <option value="" disabled>Choose a reason</option>
          {Object.entries(reportReasons).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>
      <Field label="Details (optional)" htmlFor="details" error={err.details}><Textarea id="details" name="details" rows={3} /></Field>
      <SubmitButton variant="outline" pendingText="Sending…">Send report</SubmitButton>
    </form>
  );
}
