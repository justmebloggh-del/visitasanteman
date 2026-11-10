import "server-only";
import type { ClientDef } from "@/components/admin/ResourceForm";
import type { MediaItem } from "@/components/admin/ImageUploader";
import type { ResourceDef } from "@/config/admin-resources";
import { createClient } from "@/lib/supabase/server";

export const toClientDef = (def: ResourceDef): ClientDef => ({
  themeEntity: def.themeEntity, key: def.key, singular: def.singular, fields: def.fields, hasSlug: def.hasSlug, hasCover: def.hasCover,
  galleryEntity: def.galleryEntity, seo: def.seo, slugReadOnly: false,
});

/** Options for every relation field, loaded with the signed-in staff member's own permissions. */
export async function loadRelations(def: ResourceDef) {
  const supabase = await createClient();
  const out: Record<string, { value: string; label: string }[]> = {};
  for (const f of def.fields) {
    if (!f.relation) continue;
    // Districts that have not been activated yet cannot be used to publish; say so in the picker.
    const withActive = f.relation.table === "administrative_areas";
    const { data } = await supabase.from(f.relation.table).select(withActive ? `id, ${f.relation.label}, is_active` : `id, ${f.relation.label}`).order(f.relation.label).limit(500);
    out[f.name] = ((data ?? []) as unknown as Record<string, string | boolean>[]).map((r) => ({
      value: String(r.id),
      label: String(r[f.relation!.label]) + (withActive && r.is_active === false ? " (not yet activated)" : ""),
    }));
  }
  return out;
}

export async function loadMedia(coverId: string | null, entityType?: string, entityId?: string): Promise<{ cover: MediaItem[]; gallery: MediaItem[] }> {
  const supabase = await createClient();
  const cover: MediaItem[] = [];
  if (coverId) {
    const { data } = await supabase.from("media").select("id,path,alt_text").eq("id", coverId).maybeSingle();
    if (data) cover.push(data);
  }
  let gallery: MediaItem[] = [];
  if (entityType && entityId) {
    const { data } = await supabase.from("media_links").select("sort_order, media:media_id(id,path,alt_text)").eq("entity_type", entityType).eq("entity_id", entityId).order("sort_order");
    gallery = ((data ?? []) as unknown as { media: MediaItem | null }[]).map((r) => r.media).filter((m): m is MediaItem => !!m);
  }
  return { cover, gallery };
}

/** All active themes, and the ones already attached to this record, for the theme picker. */
export async function loadThemes(def: ResourceDef, rowId?: string): Promise<{ options: { id: string; name: string; kind: string }[]; selected: string[] }> {
  if (!def.themeEntity) return { options: [], selected: [] };
  const supabase = await createClient();
  const [{ data: themes }, { data: links }] = await Promise.all([
    supabase.from("themes").select("id,name,kind").eq("is_active", true).order("sort_order"),
    rowId ? supabase.from("theme_links").select("theme_id").eq("entity_type", def.themeEntity).eq("entity_id", rowId) : Promise.resolve({ data: [] }),
  ]);
  return { options: themes ?? [], selected: (links ?? []).map((l: { theme_id: string }) => l.theme_id) };
}
