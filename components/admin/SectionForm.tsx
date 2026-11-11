"use client";

import { useActionState } from "react";
import { saveHomepageSection } from "@/app/admin/actions";
import { ImageUploader, type MediaItem } from "@/components/admin/ImageUploader";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice, Textarea } from "@/components/ui";
import type { FormState } from "@/lib/validations/forms";

export function SectionForm({ s, hero }: {
  s: { key: string; title: string | null; subtitle: string | null; body: string | null; is_enabled: boolean; config?: unknown };
  hero: MediaItem[];
}) {
  const items = ((s.config as { items?: Record<string, string>[] } | null)?.items ?? []);
  const itemsText = items.map((i) => (s.key === "glance" ? `${i.label} | ${i.value}` : `${i.title} | ${i.text} | ${i.href}`)).join("\n");
  const [state, action] = useActionState<FormState, FormData>(saveHomepageSection.bind(null, s.key), {});
  return (
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-3">
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Field label="Heading" htmlFor={`${s.key}-t`}><Input id={`${s.key}-t`} name="title" defaultValue={s.title ?? ""} maxLength={200} /></Field>
      <Field label="Subheading" htmlFor={`${s.key}-s`}><Input id={`${s.key}-s`} name="subtitle" defaultValue={s.subtitle ?? ""} maxLength={400} /></Field>
      {s.key === "intro" && <Field label="Introduction text" htmlFor={`${s.key}-b`} hint="Shown only when filled in."><Textarea id={`${s.key}-b`} name="body" defaultValue={s.body ?? ""} rows={5} /></Field>}
      {(s.key === "glance" || s.key === "highlights") && (
        <Field label={s.key === "glance" ? "Facts" : "Cards"} htmlFor={`${s.key}-i`}
          hint={s.key === "glance" ? 'One per line: Label | Value (up to 12).' : 'One per line: Title | Text | /link (up to 12).'}>
          <Textarea id={`${s.key}-i`} name="items_text" defaultValue={itemsText} rows={7} />
        </Field>
      )}
      {s.key === "hero" && (
        <>
          <ImageUploader name="hero_media_id" label="Hero background photograph" initial={hero} folder="homepage" />
        </>
      )}
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_enabled" defaultChecked={s.is_enabled} className="size-4 accent-[var(--color-forest)]" />Show on homepage</label>
        <SubmitButton size="sm" pendingText="Saving…">Save section</SubmitButton>
      </div>
    </form>
  );
}
