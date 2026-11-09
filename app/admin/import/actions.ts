"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { buildPreview, importable, templates, type ImportTarget, type Lookups, type Preview } from "@/lib/import/csv";
import { createClient } from "@/lib/supabase/server";

export interface ImportState { ok?: boolean; message?: string; target?: ImportTarget; csv?: string; preview?: Preview; imported?: number; skipped?: number; failed?: string[] }

const MAX_BYTES = 1_000_000;
const isTarget = (t: unknown): t is ImportTarget => t === "attractions" || t === "communities";

async function loadLookups(target: ImportTarget): Promise<Lookups> {
  const supabase = await createClient();                      // the signed-in staff member's own permissions (RLS)
  const table = target === "attractions" ? "attractions" : "communities";
  const [areas, communities, categories, existing] = await Promise.all([
    supabase.from("administrative_areas").select("id,slug,name").limit(1000),
    supabase.from("communities").select("id,slug,name").limit(5000),
    supabase.from("attraction_categories").select("id,slug,name").limit(200),
    supabase.from(table).select(target === "attractions" ? "slug,name,alt_names,latitude,longitude" : "slug,name,alt_names,latitude,longitude").limit(20000),
  ]);
  return {
    areas: areas.data ?? [], communities: communities.data ?? [], categories: categories.data ?? [],
    existing: ((existing.data ?? []) as unknown as Lookups["existing"]).map((e) => ({ ...e, alt_names: e.alt_names ?? [] })),
  };
}

export async function previewImport(_prev: ImportState, fd: FormData): Promise<ImportState> {
  await requireStaff();
  const target = fd.get("target");
  if (!isTarget(target)) return { ok: false, message: "Choose what you are importing." };
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, target, message: "Choose a CSV file." };
  if (file.size > MAX_BYTES) return { ok: false, target, message: "That file is larger than 1 MB. Split it into smaller files." };
  if (!/\.csv$/i.test(file.name) && file.type && !/csv|text\/plain|excel/i.test(file.type)) return { ok: false, target, message: "Upload a .csv file." };
  const csv = await file.text();
  const preview = buildPreview(target, csv, await loadLookups(target));
  if (preview.missingColumns.length) return { ok: false, target, message: `The file is missing required column(s): ${preview.missingColumns.join(", ")}. Download the template for the exact headings.` };
  if (preview.tooLarge) return { ok: false, target, message: "More than 500 rows. Split the file." };
  if (preview.rows.length === 0) return { ok: false, target, message: "The file has a header but no rows." };
  return { ok: true, target, csv, preview };
}

export async function commitImport(_prev: ImportState, fd: FormData): Promise<ImportState> {
  const user = await requireStaff();
  const target = fd.get("target");
  const csv = fd.get("csv");
  if (!isTarget(target) || typeof csv !== "string" || csv.length > MAX_BYTES) return { ok: false, message: "Nothing to import." };

  // Never trust the preview the browser held: validate again from the raw CSV.
  const preview = buildPreview(target, csv, await loadLookups(target));
  if (preview.missingColumns.length || preview.tooLarge) return { ok: false, message: "The file is not valid." };
  const rows = importable(preview);
  const supabase = await createClient();
  const table = target === "attractions" ? "attractions" : "communities";
  let imported = 0;
  const failed: string[] = [];
  for (const r of rows) {
    const { error } = await supabase.from(table).insert({ ...r.values, created_by: user.id });
    if (error) failed.push(`Line ${r.line} (${r.name}): ${error.code === "23505" ? "a record with this URL name already exists" : "could not be saved"}`);
    else imported++;
  }
  revalidatePath("/", "layout");
  return {
    ok: failed.length === 0, target, imported, skipped: preview.rows.length - rows.length, failed,
    message: `Imported ${imported} ${templates[target].label.toLowerCase()} as unpublished drafts.`,
  };
}
