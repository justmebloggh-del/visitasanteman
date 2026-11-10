"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/admin/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice } from "@/components/ui";
import type { FormState } from "@/lib/validations/forms";

type S = Record<string, Record<string, string | number>>;

export function SettingsForm({ s }: { s: S }) {
  const [state, action] = useActionState<FormState, FormData>(saveSettings, {});
  const e = state.errors ?? {};
  const g = s.general ?? {}, c = s.contact ?? {}, so = s.social ?? {}, m = s.map ?? {};
  const f = (name: string, label: string, v: unknown, extra?: { type?: string; hint?: string; step?: string }) => (
    <Field label={label} htmlFor={name} error={e[name]} hint={extra?.hint}><Input id={name} name={name} type={extra?.type ?? "text"} step={extra?.step} defaultValue={String(v ?? "")} /></Field>
  );
  return (
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-6">
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Card title="General">{f("site_name", "Site name", g.site_name)}{f("tagline", "Tagline", g.tagline)}{f("hashtag", "Campaign hashtag (footer ticker)", g.hashtag ?? "#VisitAsanteman", { hint: "Letters and numbers, with or without the #." })}</Card>
      <Card title="Contact details (shown in the footer and contact page)">
        {f("email", "Email", c.email, { type: "email" })}{f("phone", "Phone", c.phone)}
        {f("whatsapp", "WhatsApp number", c.whatsapp, { hint: "Digits with country code, e.g. 233XXXXXXXXX. Switches on the floating “Chat on WhatsApp” button; leave blank to hide it." })}{f("address", "Address", c.address)}
      </Card>
      <Card title="Social media (full links)">{f("facebook", "Facebook", so.facebook, { type: "url" })}{f("instagram", "Instagram", so.instagram, { type: "url" })}{f("x", "X / Twitter", so.x, { type: "url" })}{f("youtube", "YouTube", so.youtube, { type: "url" })}</Card>
      <Card title="Map starting view">
        {f("center_lat", "Centre latitude", m.center_lat, { type: "number", step: "any" })}{f("center_lng", "Centre longitude", m.center_lng, { type: "number", step: "any" })}
        {f("zoom", "Zoom (1-18)", m.zoom, { type: "number", step: "any" })}
      </Card>
      <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-line bg-white p-5 sm:p-6"><h2 className="mb-4 font-serif text-lg font-semibold text-forest">{title}</h2><div className="grid gap-4 sm:grid-cols-2">{children}</div></section>;
}
