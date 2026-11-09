import "server-only";
import type { ClientDef } from "@/components/admin/ResourceForm";
import type { MediaItem } from "@/components/admin/ImageUploader";
import type { ResourceDef } from "@/config/admin-resources";
import { createClient } from "@/lib/supabase/server";

export const toClientDef = (def: ResourceDef): ClientDef => ({
  key: def.key, singular: def.singular, fields: def.fields, hasSlug: def.hasSlug, hasCover: def.hasCover,
  galleryEntity: def.galleryEntity, seo: def.seo, slugReadOnly: false,
});

/** Options for every relation field, loaded with the signed-in staff member's own permissions. */
export async function loadRelations(def: ResourceDef) {
  const supabase = await createClient();
  const out: Record<string, { value: string; label: string }[]> = {};
  for (const f of def.fields) {
    if (!f.relation) continue;
    const { data } = await supabase.from(f.relation.table).select(`id, ${f.relation.label}`).order(f.relation.label).limit(500);
    out[f.name] = ((data ?? []) as unknown as Record<string, string>[]).map((r) => ({ value: r.id, label: r[f.relation!.label] }));
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
