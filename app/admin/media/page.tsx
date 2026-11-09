import type { Metadata } from "next";
import { AdminHeader, Flash } from "@/components/admin/ui";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Pagination } from "@/components/layout/blocks";
import { Button, Field, Input } from "@/components/ui";
import { deleteMedia, updateMedia } from "@/app/admin/actions";
import { isAdmin, requireMediaAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Media library" };
const PER = 24;

export default async function MediaLibrary({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireMediaAccess();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const folder = sp.folder && /^[a-z0-9-]{1,40}$/.test(sp.folder) ? sp.folder : "";
  const supabase = await createClient();
  let q = supabase.from("media").select("*", { count: "exact" }).is("deleted_at", null).order("created_at", { ascending: false });
  if (folder) q = q.eq("folder", folder);
  const { data, count } = await q.range((page - 1) * PER, page * PER - 1);

  return (
    <>
      <AdminHeader title="Media library" intro="Upload photographs once, then choose them on any page. Images are optimised automatically. Files in the “gallery” folder appear on the public Gallery page." />
      <Flash sp={sp} />
      <div className="mb-8 rounded-2xl border border-line bg-white p-5">
        <form className="mb-4 flex items-end gap-2" method="get"><Field label="Folder for new uploads and filter" htmlFor="folder"><Input id="folder" name="folder" defaultValue={folder} placeholder="general" pattern="[a-z0-9-]{1,40}" /></Field><Button variant="outline">Apply</Button></form>
        <ImageUploader key={folder} name="library_upload" label="Upload images" multiple initial={[]} folder={folder || "general"} hint="After uploading, refresh the page to see new files in the grid." />
      </div>
      {(data ?? []).length === 0 ? <p className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">No images yet.</p> : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data!.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-2xl border border-line bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(m.path) ?? ""} alt={m.alt_text} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <form action={updateMedia.bind(null, m.id)} className="space-y-2 p-3">
                <Field label="Alt text" htmlFor={`alt-${m.id}`}><Input id={`alt-${m.id}`} name="alt_text" defaultValue={m.alt_text} maxLength={300} /></Field>
                <Field label="Caption" htmlFor={`cap-${m.id}`}><Input id={`cap-${m.id}`} name="caption" defaultValue={m.caption ?? ""} maxLength={300} /></Field>
                <Field label="Photographer / credit" htmlFor={`cr-${m.id}`}><Input id={`cr-${m.id}`} name="credit" defaultValue={m.credit ?? ""} maxLength={200} /></Field>
                <Field label="Folder" htmlFor={`fo-${m.id}`}><Input id={`fo-${m.id}`} name="folder" defaultValue={m.folder} pattern="[a-z0-9-]{1,40}" /></Field>
                <div className="flex justify-between gap-2"><Button size="sm" variant="outline">Save</Button></div>
              </form>
              {isAdmin(user.role) && <form action={deleteMedia.bind(null, m.id)} className="px-3 pb-3"><Button size="sm" variant="danger" aria-label={`Delete ${m.alt_text || "image"}`}>Delete (if unused)</Button></form>}
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={Math.max(1, Math.ceil((count ?? 0) / PER))} basePath="/admin/media" params={{ folder: folder || undefined }} />
    </>
  );
}
