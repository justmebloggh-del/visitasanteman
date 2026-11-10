"use client";

import { useActionState } from "react";
import { saveVacancy } from "@/app/actions/jobs";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui";
import { employmentTypes, salaryPeriods } from "@/config/jobs";
import type { FormState } from "@/lib/validations/forms";

export interface VacancyValues {
  title?: string; employment_type?: string; category_id?: string | null; administrative_area_id?: string | null; location_note?: string | null;
  description?: string; requirements?: string | null; qualifications?: string | null; experience_required?: string | null;
  salary_min?: number | null; salary_max?: number | null; salary_period?: string | null; application_deadline?: string | null;
}

export function VacancyForm({ id, values, categories, areas }: { id: string | null; values?: VacancyValues; categories: { id: string; name: string }[]; areas: { id: string; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(saveVacancy.bind(null, id), {});
  const err = state.errors ?? {};
  return (
    <form action={action} noValidate className="space-y-5">
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Field label="Job title" htmlFor="title" error={err.title}><Input id="title" name="title" required defaultValue={values?.title} aria-invalid={!!err.title} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Employment type" htmlFor="employment_type" error={err.employment_type}>
          <Select id="employment_type" name="employment_type" defaultValue={values?.employment_type ?? "full_time"}>
            {Object.entries(employmentTypes).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Field" htmlFor="category_id">
          <Select id="category_id" name="category_id" defaultValue={values?.category_id ?? ""}><option value="">Not specified</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        </Field>
        <Field label="District" htmlFor="administrative_area_id" hint="Required before a vacancy can be published.">
          <Select id="administrative_area_id" name="administrative_area_id" defaultValue={values?.administrative_area_id ?? ""}><option value="">Not specified</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
        </Field>
      </div>
      <Field label="Town or place (optional)" htmlFor="location_note" error={err.location_note}><Input id="location_note" name="location_note" defaultValue={values?.location_note ?? ""} /></Field>
      <Field label="Description" htmlFor="description" error={err.description}><Textarea id="description" name="description" rows={7} required defaultValue={values?.description} /></Field>
      <Field label="Requirements" htmlFor="requirements" error={err.requirements}><Textarea id="requirements" name="requirements" rows={4} defaultValue={values?.requirements ?? ""} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Qualifications" htmlFor="qualifications" error={err.qualifications}><Input id="qualifications" name="qualifications" defaultValue={values?.qualifications ?? ""} /></Field>
        <Field label="Experience" htmlFor="experience_required" error={err.experience_required}><Input id="experience_required" name="experience_required" defaultValue={values?.experience_required ?? ""} /></Field>
      </div>
      <fieldset className="grid gap-4 sm:grid-cols-4">
        <legend className="mb-2 text-sm font-medium text-ink">Pay in GHS (optional)</legend>
        <Field label="From" htmlFor="salary_min" error={err.salary_min}><Input id="salary_min" name="salary_min" type="number" min={0} step="0.01" defaultValue={values?.salary_min ?? ""} /></Field>
        <Field label="To" htmlFor="salary_max" error={err.salary_max}><Input id="salary_max" name="salary_max" type="number" min={0} step="0.01" defaultValue={values?.salary_max ?? ""} /></Field>
        <Field label="Per" htmlFor="salary_period" error={err.salary_period}>
          <Select id="salary_period" name="salary_period" defaultValue={values?.salary_period ?? ""}><option value="">-</option>{Object.entries(salaryPeriods).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        </Field>
        <Field label="Apply by" htmlFor="application_deadline" error={err.application_deadline}><Input id="application_deadline" name="application_deadline" type="date" defaultValue={values?.application_deadline ?? ""} /></Field>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <SubmitButton name="intent" value="draft" variant="outline" pendingText="Saving…">Save draft</SubmitButton>
        <SubmitButton name="intent" value="submit" pendingText="Submitting…">Submit for review</SubmitButton>
      </div>
      <p className="text-xs text-muted">Every vacancy is reviewed before it appears. You must not charge applicants. Editing a published vacancy sends it back for review.</p>
    </form>
  );
}
