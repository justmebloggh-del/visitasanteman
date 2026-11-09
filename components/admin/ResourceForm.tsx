"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveResource } from "@/app/admin/actions";
import { ImageUploader, type MediaItem } from "@/components/admin/ImageUploader";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui";
import type { FieldDef } from "@/config/admin-resources";
import type { FormState } from "@/lib/validations/forms";

export interface ClientDef {
  key: string; singular: string; fields: FieldDef[]; hasSlug: boolean; hasCover: boolean;
  galleryEntity?: string; seo: boolean; slugReadOnly: boolean;
}

const GROUPS: { id: NonNullable<FieldDef["group"]>; title: string }[] = [
  { id: "main", title: "Essentials" }, { id: "details", title: "Details" },
  { id: "location", title: "Location" }, { id: "contact", title: "Contact" },
];

function control(f: FieldDef, value: unknown, error: string | undefined, options: { value: string; label: string }[], disabled: boolean) {
  const common = { id: f.name, name: f.name, disabled, "aria-invalid": !!error } as const;
  switch (f.type) {
    case "textarea": return <Textarea {...common} defaultValue={(value as string) ?? ""} rows={4} />;
    case "markdown": return <Textarea {...common} defaultValue={(value as string) ?? ""} rows={16} className="font-mono text-[13px]" />;
    case "number": return <Input {...common} type="number" step="any" min={0} defaultValue={(value as number | null) ?? ""} />;
    case "lat": case "lng": return <Input {...common} type="number" step="any" defaultValue={(value as number | null) ?? ""} />;
    case "select": return (
      <Select {...common} defaultValue={(value as string) ?? ""}>
        {!f.required && <option value="">None</option>}
        {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
    );
    case "relation": return (
      <Select {...common} defaultValue={(value as string) ?? ""}>
        <option value="">{f.required ? "Choose…" : "None"}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
    );
    case "checkbox": return (
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...common} defaultChecked={!!value} className="size-4 accent-[var(--color-forest)]" />{f.label}</label>
    );
    case "date": return <Input {...common} type="date" defaultValue={typeof value === "string" ? value.slice(0, 10) : ""} />;
    case "datetime": return <Input {...common} type="datetime-local" defaultValue={typeof value === "string" ? value.slice(0, 16) : ""} />;
    case "tags": return <Input {...common} defaultValue={Array.isArray(value) ? (value as string[]).join(", ") : ""} />;
    case "url": return <Input {...common} type="url" defaultValue={(value as string) ?? ""} placeholder="https://" />;
    case "email": return <Input {...common} type="email" defaultValue={(value as string) ?? ""} />;
    default: return <Input {...common} defaultValue={(value as string) ?? ""} />;
  }
}

export function ResourceForm({ def, id, initial, relations, isAdmin, canApprove, cover, gallery, customAction, uploadFolder, cancelHref, partner, maxGallery }: {
  def: ClientDef; id: string | null; initial: Record<string, unknown>;
  relations: Record<string, { value: string; label: string }[]>; isAdmin: boolean; canApprove?: boolean;
  cover: MediaItem[]; gallery: MediaItem[];
  customAction?: (prev: FormState, fd: FormData) => Promise<FormState>;
  uploadFolder?: string; cancelHref?: string; partner?: boolean; maxGallery?: number;
}) {
  const [state, action] = useActionState<FormState, FormData>(customAction ?? saveResource.bind(null, def.key, id), {});
  const err = state.errors ?? {};

  return (
    <form action={action} onReset={(e) => e.preventDefault()} noValidate className="space-y-8">
      {state.message && !state.ok && <Notice tone="error">{state.message}</Notice>}

      {GROUPS.map((g) => {
        const fields = def.fields.filter((f) => (f.group ?? "details") === g.id);
        if (!fields.length && !(g.id === "main" && (def.hasSlug || def.hasCover))) return null;
        return (
          <section key={g.id} className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <h2 className="mb-4 font-serif text-lg font-semibold text-forest">{g.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                const locked = (!!f.adminOnly && !isAdmin) || (!!f.approverOnly && !canApprove);
                const wide = ["textarea", "markdown", "text"].includes(f.type) && f.name !== "price_note" && f.name !== "price_unit";
                return (
                  <Field key={f.name} label={f.type === "checkbox" ? "" : f.label} htmlFor={f.name} error={err[f.name]}
                    hint={locked ? (f.approverOnly ? "Only regional editors and administrators can change this." : "Only administrators can change this.") : f.hint} className={wide || f.type === "checkbox" ? "sm:col-span-2" : undefined}>
                    {control(f, initial[f.name], err[f.name], f.relation ? relations[f.name] ?? [] : [], locked)}
                  </Field>
                );
              })}
              {g.id === "main" && def.hasSlug && (
                <Field label="URL slug" htmlFor="slug" error={err.slug} hint="Part of the page address. Leave blank to create it from the title. Changing it later breaks old links." className="sm:col-span-2">
                  <Input id="slug" name="slug" defaultValue={(initial.slug as string) ?? ""} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
                </Field>
              )}
            </div>
            {g.id === "main" && def.hasCover && <div className="mt-5"><ImageUploader name="cover_media_id" label="Main photograph" initial={cover} folder={uploadFolder} hint="Shown on cards and at the top of the page." /></div>}
            {g.id === "main" && def.galleryEntity && <div className="mt-4"><ImageUploader name="gallery_media_ids" label="Image gallery" multiple initial={gallery} folder={uploadFolder} max={maxGallery} /></div>}
          </section>
        );
      })}

      {def.seo && (
        <details className="rounded-2xl border border-line bg-white p-5 sm:p-6" open={!!(initial.seo_title || initial.seo_description)}>
          <summary className="cursor-pointer font-serif text-lg font-semibold text-forest">Search engine (SEO)</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="SEO title" htmlFor="seo_title" error={err.seo_title} hint="Up to 70 characters. Defaults to the title." className="sm:col-span-2"><Input id="seo_title" name="seo_title" defaultValue={(initial.seo_title as string) ?? ""} maxLength={80} /></Field>
            <Field label="Meta description" htmlFor="seo_description" error={err.seo_description} hint="Up to 160 characters." className="sm:col-span-2"><Textarea id="seo_description" name="seo_description" defaultValue={(initial.seo_description as string) ?? ""} rows={2} maxLength={200} /></Field>
            <Field label="Focus keywords" htmlFor="focus_keywords"><Input id="focus_keywords" name="focus_keywords" defaultValue={(initial.focus_keywords as string) ?? ""} /></Field>
            <Field label="Canonical URL" htmlFor="canonical_url" error={err.canonical_url} hint="Only if this content also lives elsewhere."><Input id="canonical_url" name="canonical_url" type="url" defaultValue={(initial.canonical_url as string) ?? ""} /></Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="noindex" defaultChecked={!!initial.noindex} className="size-4 accent-[var(--color-forest)]" />Hide from search engines (noindex)</label>
          </div>
        </details>
      )}

      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-b-2xl">
        {partner ? (
          <>
            <SubmitButton name="intent" value="draft" variant="outline" pendingText="Saving…">Save draft</SubmitButton>
            <SubmitButton name="intent" value="submit" pendingText="Submitting…">Submit for review</SubmitButton>
          </>
        ) : (
          <SubmitButton pendingText="Saving…">{id ? "Save changes" : `Create ${def.singular}`}</SubmitButton>
        )}
        <Link href={cancelHref ?? `/admin/${def.key}`} className="text-sm text-muted hover:text-forest">Cancel</Link>
      </div>
    </form>
  );
}
