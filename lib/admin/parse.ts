import type { FieldDef, ResourceDef } from "@/config/admin-resources";
import { safeUrl, slugify } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface ParseResult {
  values: Record<string, unknown>;
  errors: Record<string, string>;
}

const str = (fd: FormData, name: string) => {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
};

function parseField(f: FieldDef, fd: FormData): { value?: unknown; error?: string } {
  const raw = str(fd, f.name);
  const empty = raw === "";
  const need = () => (f.required && empty ? `${f.label} is required` : undefined);

  switch (f.type) {
    case "checkbox":
      return { value: fd.get(f.name) === "on" };
    case "text":
    case "textarea":
    case "markdown": {
      const max = f.max ?? (f.type === "text" ? 300 : f.type === "textarea" ? 20000 : 100000);
      if (need()) return { error: need() };
      if (raw.length > max) return { error: `${f.label} must be at most ${max} characters` };
      return { value: empty ? (f.type === "markdown" ? "" : null) : raw };
    }
    case "number": {
      if (need()) return { error: need() };
      if (empty) return { value: null };
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) return { error: `${f.label} must be a number, 0 or more` };
      return { value: n };
    }
    case "lat":
    case "lng": {
      if (empty) return { value: null };
      const n = Number(raw);
      const lim = f.type === "lat" ? 90 : 180;
      if (!Number.isFinite(n) || Math.abs(n) > lim) return { error: `${f.label} must be between -${lim} and ${lim}` };
      return { value: Math.round(n * 1e6) / 1e6 };
    }
    case "select": {
      if (need()) return { error: need() };
      if (empty) return { value: null };
      if (!f.options?.some((o) => o.value === raw)) return { error: `Choose a valid ${f.label.toLowerCase()}` };
      return { value: raw };
    }
    case "relation": {
      if (need()) return { error: need() };
      if (empty) return { value: null };
      return UUID.test(raw) ? { value: raw } : { error: `Choose a valid ${f.label.toLowerCase()}` };
    }
    case "url": {
      if (need()) return { error: need() };
      if (empty) return { value: null };
      return safeUrl(raw) ? { value: raw } : { error: `${f.label} must start with http:// or https://` };
    }
    case "email": {
      if (need()) return { error: need() };
      if (empty) return { value: null };
      return EMAIL.test(raw) ? { value: raw.toLowerCase() } : { error: `${f.label} is not a valid email address` };
    }
    case "date": {
      if (need()) return { error: need() };
      if (empty) return { value: null };
      return /^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(raw)) ? { value: raw } : { error: `${f.label} is not a valid date` };
    }
    case "datetime": {
      if (need()) return { error: need() };
      if (empty) return { value: null };
      // datetime-local has no zone. Ghana is UTC+0 all year, so it is stored as UTC.
      const iso = `${raw.length === 16 ? `${raw}:00` : raw}Z`;
      return Number.isNaN(Date.parse(iso)) ? { error: `${f.label} is not a valid date` } : { value: new Date(iso).toISOString() };
    }
    case "tags": {
      const tags = Array.from(new Set(raw.split(",").map((t) => t.trim()).filter(Boolean)));
      if (tags.length > 30 || tags.some((t) => t.length > 80)) return { error: `${f.label}: too many or too long` };
      return { value: tags };
    }
  }
}

/** Turns submitted form data into a database payload. Pure: no I/O, easy to test. */
export function parseResourceForm(def: ResourceDef, fd: FormData, o: { isAdmin: boolean; canApprove?: boolean }): ParseResult {
  const values: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const f of def.fields) {
    // Admin-only fields are ignored from editors, whatever the browser sends.
    if (f.adminOnly && !o.isAdmin) continue;
    if (f.approverOnly && !o.canApprove) continue;
    const r = parseField(f, fd);
    if (r.error) errors[f.name] = r.error;
    else values[f.name] = r.value;
  }

  // sort_order is NOT NULL in the database; a blank field means the default.
  if ("sort_order" in values && values.sort_order == null) values.sort_order = 0;

  // Only check the pair when both parsed cleanly, so a range error is not hidden by this message.
  if (!errors.latitude && !errors.longitude) {
    const hasLat = values.latitude != null, hasLng = values.longitude != null;
    if (hasLat !== hasLng) errors[hasLat ? "longitude" : "latitude"] = "Enter both latitude and longitude, or neither";
  }

  if (def.seo) {
    const t = str(fd, "seo_title"), d = str(fd, "seo_description"), k = str(fd, "focus_keywords"), c = str(fd, "canonical_url");
    if (t.length > 70) errors.seo_title = "SEO title should be 70 characters or fewer";
    if (d.length > 170) errors.seo_description = "Meta description should be 170 characters or fewer";
    if (c && !safeUrl(c)) errors.canonical_url = "Canonical URL must start with http:// or https://";
    Object.assign(values, { seo_title: t || null, seo_description: d || null, focus_keywords: k || null, canonical_url: c || null, noindex: fd.get("noindex") === "on" });
  }

  if (def.hasCover) {
    const cover = str(fd, "cover_media_id");
    if (cover && !UUID.test(cover)) errors.cover_media_id = "Invalid image";
    values.cover_media_id = cover || null;
  }

  if (def.hasSlug) {
    const slug = str(fd, "slug") || slugify(String(values[def.titleField] ?? ""));
    if (!slug || !SLUG.test(slug)) errors.slug = "URL slug may only contain lowercase letters, numbers and hyphens";
    values.slug = slug;
  }

  // Friendly version of the database publish guard (the database still enforces it).
  if (def.area && values.status === "published" && !values.administrative_area_id && !values.community_id && !values.destination_id) {
    errors.administrative_area_id = "Choose a district, municipality or metropolis (or a community) before publishing";
  }
  if (def.key === "articles" && values.status === "published" && !values.published_at) {
    values.published_at = new Date().toISOString();
  }
  if (def.typeFilter && typeof values[def.typeFilter.column] === "string" && !def.typeFilter.values.includes(values[def.typeFilter.column] as string)) {
    errors[def.typeFilter.column] = "Not allowed for this section";
  }
  if (def.key === "ceremonies") {
    if (values.date_confirmed && !values.starts_at) errors.starts_at = "Enter the start date before confirming it";
    if (values.starts_at && values.ends_at && String(values.ends_at) < String(values.starts_at)) errors.ends_at = "End must be after the start";
  }
  if (def.key === "events" && values.starts_at && values.ends_at && String(values.ends_at) < String(values.starts_at)) {
    errors.ends_at = "End must be after the start";
  }
  if (def.key === "investments") {
    if ((values.stage === "approved" || values.stage === "operational") && !values.stage_source) errors.stage_source = "Name the source before marking a project approved or existing";
    const hasEst = values.investment_min != null || values.investment_max != null;
    if (hasEst && !values.investment_note) errors.investment_note = "Say where the estimate comes from";
    if (values.investment_min != null && values.investment_max != null && Number(values.investment_max) < Number(values.investment_min)) errors.investment_max = "Maximum must be at least the minimum";
  }
  if (def.key === "advertisements" && values.starts_at && values.ends_at && String(values.ends_at) <= String(values.starts_at)) errors.ends_at = "End must be after the start";
  if (def.key === "testimonials" && values.rating != null && (Number(values.rating) < 1 || Number(values.rating) > 5)) {
    errors.rating = "Rating must be 1 to 5";
  }
  return { values, errors };
}

export function parseIdList(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return Array.from(new Set(raw.split(",").map((s) => s.trim()).filter((s) => UUID.test(s)))).slice(0, 60);
}
