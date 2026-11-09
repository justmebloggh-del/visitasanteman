import { slugify } from "@/lib/utils";

/** Minimal RFC 4180 CSV parser: quoted fields, escaped quotes, CRLF, embedded newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') { if (src[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

export const toCsv = (rows: string[][]) =>
  rows.map((r) => r.map((v) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(",")).join("\r\n") + "\r\n";

export type ImportTarget = "attractions" | "communities";

export const templates: Record<ImportTarget, { label: string; columns: string[]; required: string[]; example: string[] }> = {
  attractions: {
    label: "Attractions and heritage sites",
    columns: ["name", "category", "district", "community", "summary", "latitude", "longitude", "access_status", "access_notes", "managing_institution", "alt_names", "source_organisation", "source_url", "source_published_at", "researched_at", "research_notes"],
    required: ["name", "source_organisation"],
    // The example row is a format guide only. It is clearly fake and never loaded as data.
    example: ["EXAMPLE ONLY - delete this row", "natural", "Name of a district as listed in Admin > Districts", "", "", "", "", "unknown", "", "", "Alternative spelling; Another spelling", "Name of the source document or body", "https://example.org/source", "2023-01-31", "2026-11-09", "What still needs checking"],
  },
  communities: {
    label: "Communities",
    columns: ["name", "district", "summary", "latitude", "longitude", "alt_names", "sources"],
    required: ["name", "sources"],
    example: ["EXAMPLE ONLY - delete this row", "Name of a district as listed in Admin > Districts", "", "", "", "Alternative spelling", "Where this information comes from"],
  },
};

const ACCESS = ["unknown", "open_to_visitors", "permission_required", "restricted_access", "temporarily_unavailable", "permanently_closed", "proposed"];
export const normaliseName = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const key = (s: string) => normaliseName(s).replace(/ /g, "_");

export interface Lookups {
  areas: { id: string; slug: string; name: string }[];
  communities: { id: string; slug: string; name: string }[];
  categories: { id: string; slug: string; name: string }[];
  existing: { slug: string; name: string; alt_names: string[]; latitude: number | null; longitude: number | null }[];
}

export interface PreviewRow {
  line: number;                       // line in the file (header is line 1)
  name: string;
  values: Record<string, unknown>;    // database payload when valid
  errors: string[];
  warnings: string[];
  duplicate: string | null;           // reason this row will be skipped
}

export interface Preview { target: ImportTarget; unknownColumns: string[]; missingColumns: string[]; rows: PreviewRow[]; tooLarge?: boolean }

const MAX_ROWS = 500;
const km = (a: [number, number], b: [number, number]) => {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const match = <T extends { slug: string; name: string }>(list: T[], v: string) => {
  const n = normaliseName(v);
  return list.find((x) => x.slug === v.toLowerCase() || normaliseName(x.name) === n);
};

/** Validates a CSV for one target. Pure: no database access, the caller supplies the lookups. */
export function buildPreview(target: ImportTarget, text: string, lookups: Lookups): Preview {
  const tpl = templates[target];
  const table = parseCsv(text);
  const header = (table[0] ?? []).map((h) => key(h));
  const known = new Set(tpl.columns);
  const unknownColumns = (table[0] ?? []).filter((_, i) => !known.has(header[i]));
  const missingColumns = tpl.required.filter((c) => !header.includes(c));
  const preview: Preview = { target, unknownColumns, missingColumns, rows: [] };
  if (missingColumns.length) return preview;
  if (table.length - 1 > MAX_ROWS) { preview.tooLarge = true; return preview; }

  const seenSlugs = new Set<string>();
  for (let r = 1; r < table.length; r++) {
    const cells = table[r];
    const get = (c: string) => { const i = header.indexOf(c); return i >= 0 ? (cells[i] ?? "").trim() : ""; };
    const row: PreviewRow = { line: r + 1, name: get("name"), values: {}, errors: [], warnings: [], duplicate: null };
    preview.rows.push(row);
    if (/^EXAMPLE ONLY/i.test(row.name)) { row.errors.push("This is the template example row. Delete it."); continue; }
    if (!row.name) { row.errors.push("Name is required"); continue; }
    if (row.name.length > 200) row.errors.push("Name is too long");
    for (const c of tpl.required) if (!get(c)) row.errors.push(`${c.replace(/_/g, " ")} is required (every researched record needs a source)`);

    const slug = slugify(row.name);
    if (!slug) row.errors.push("Name has no usable letters or numbers");
    const values: Record<string, unknown> = { slug, name: row.name };

    // coordinates: both or neither, in range
    const lat = get("latitude"), lng = get("longitude");
    if (lat || lng) {
      const la = Number(lat), lo = Number(lng);
      if (!lat || !lng) row.errors.push("Enter both latitude and longitude, or neither");
      else if (!Number.isFinite(la) || Math.abs(la) > 90 || !Number.isFinite(lo) || Math.abs(lo) > 180) row.errors.push("Coordinates are out of range");
      else { values.latitude = Math.round(la * 1e6) / 1e6; values.longitude = Math.round(lo * 1e6) / 1e6; }
    }

    const district = get("district");
    if (district) {
      const a = match(lookups.areas, district);
      if (a) values.administrative_area_id = a.id; else row.warnings.push(`District "${district}" was not found; the record will be imported without a district`);
    }
    const summary = get("summary");
    if (summary) { if (summary.length > (target === "communities" ? 600 : 400)) row.errors.push("Summary is too long"); else values.summary = summary; }
    const alt = get("alt_names");
    if (alt) values.alt_names = Array.from(new Set(alt.split(/[;,]/).map((x) => x.trim()).filter(Boolean))).slice(0, 20);

    if (target === "attractions") {
      const cat = get("category");
      if (cat) { const c = match(lookups.categories, cat); if (c) values.category_id = c.id; else row.warnings.push(`Category "${cat}" was not found; imported without a category`); }
      const comm = get("community");
      if (comm) { const c = match(lookups.communities, comm); if (c) values.community_id = c.id; else row.warnings.push(`Community "${comm}" was not found; imported without a community`); }
      const acc = get("access_status") || "unknown";
      if (!ACCESS.includes(acc)) row.errors.push(`access_status must be one of: ${ACCESS.join(", ")}`); else values.access_status = acc;
      for (const [col, max] of [["access_notes", 2000], ["managing_institution", 300], ["source_organisation", 300], ["research_notes", 4000]] as const) {
        const v = get(col); if (v) { if (v.length > max) row.errors.push(`${col} is too long`); else values[col] = v; }
      }
      const url = get("source_url");
      if (url) { if (/^https?:\/\/\S+$/i.test(url)) values.source_url = url; else row.errors.push("source_url must start with http:// or https://"); }
      for (const col of ["source_published_at", "researched_at"]) {
        const v = get(col); if (v) { if (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))) values[col] = v; else row.errors.push(`${col} must be a date like 2026-11-09`); }
      }
      // Imported records are research drafts. Status and verification can never come from the file.
      values.status = "draft"; values.verification_status = "research_identified";
    } else {
      const src = get("sources"); if (src) values.sources = src;
      values.status = "draft";
    }

    // duplicates: same slug or same normalised name (also against alternative spellings), or within 200 m
    const n = normaliseName(row.name);
    const same = lookups.existing.find((e) => e.slug === slug || normaliseName(e.name) === n || e.alt_names.some((x) => normaliseName(x) === n));
    if (same) row.duplicate = `Already exists as "${same.name}"`;
    else if (seenSlugs.has(slug)) row.duplicate = "Appears earlier in this file";
    else if (values.latitude != null) {
      const near = lookups.existing.find((e) => e.latitude != null && e.longitude != null && km([e.latitude, e.longitude!], [values.latitude as number, values.longitude as number]) < 0.2);
      if (near) row.warnings.push(`Within 200 m of existing "${near.name}": check it is not the same place`);
    }
    seenSlugs.add(slug);
    row.values = values;
  }
  return preview;
}

export const importable = (p: Preview) => p.rows.filter((r) => r.errors.length === 0 && !r.duplicate);
