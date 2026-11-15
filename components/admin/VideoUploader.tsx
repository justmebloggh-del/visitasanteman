"use client";

import { Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { MediaItem } from "@/components/admin/ImageUploader";
import { Button, Input, Notice } from "@/components/ui";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { mediaUrl } from "@/lib/utils";

const ALLOWED: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm" };
const MAX_BYTES = 50 * 1024 * 1024; // matches the storage bucket limit

/**
 * Upload short videos (MP4 or WebM, up to 50 MB) for an event. The file goes to the media bucket as it is,
 * a media record is created, and the form saves the link when the event is saved.
 * Longer films are better hosted on YouTube and linked from the description.
 */
export function VideoUploader({ name, label, initial, folder = "general", hint }: {
  name: string; label: string; initial: MediaItem[]; folder?: string; hint?: string;
}) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    const reset = () => { if (fileInput.current) fileInput.current.value = ""; };
    if (!alt.trim()) { setError("Describe the video first. The description is shown with it and read aloud to people using screen readers."); reset(); return; }
    const ext = ALLOWED[file.type];
    if (!ext) { setError(`${file.name}: only MP4 or WebM videos are allowed`); reset(); return; }
    if (file.size > MAX_BYTES) { setError(`${file.name}: videos can be up to 50 MB. Compress it, or host it on YouTube and link to it.`); reset(); return; }
    setBusy(true);
    try {
      const supabase = createBrowserSupabase();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Your session has expired. Please log in again.");
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw new Error(`Upload failed: ${up.error.message}`);
      const { data, error: dbErr } = await supabase.from("media").insert({
        path, alt_text: alt.trim(), mime_type: file.type, size_bytes: file.size, folder, uploaded_by: auth.user.id,
      }).select("id,path,alt_text,mime_type").single();
      if (dbErr || !data) {
        await supabase.storage.from("media").remove([path]); // do not leave an orphaned file
        throw new Error(`Could not save the video record${dbErr ? `: ${dbErr.message}` : ""}`);
      }
      setItems((prev) => [...prev, data]);
      setAlt("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      reset();
    }
  }

  return (
    <fieldset className="rounded-xl border border-line p-4">
      <legend className="px-1 text-sm font-medium text-ink">{label}</legend>
      <input type="hidden" name={name} value={items.map((i) => i.id).join(",")} />
      {items.length > 0 && (
        <ul className="mb-4 grid gap-3 sm:grid-cols-2">
          {items.map((i) => (
            <li key={i.id} className="relative overflow-hidden rounded-lg border border-line">
              <video src={mediaUrl(i.path) ?? undefined} controls preload="metadata" playsInline aria-label={i.alt_text} className="aspect-video w-full bg-black" />
              <p className="px-3 py-2 text-xs text-muted">{i.alt_text}</p>
              <button type="button" onClick={() => setItems((p) => p.filter((x) => x.id !== i.id))} aria-label={`Remove video: ${i.alt_text}`}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/95 text-red-700 shadow hover:bg-white"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label htmlFor={`${name}-alt`} className="mb-1.5 block text-xs font-medium text-muted">Video description for the next upload</label>
          <Input id={`${name}-alt`} value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} placeholder="e.g. Highlights of last year's durbar" />
        </div>
        <div>
          <input ref={fileInput} type="file" accept={Object.keys(ALLOWED).join(",")} className="sr-only" id={`${name}-file`} onChange={(e) => onFiles(e.target.files)} disabled={busy} />
          <Button type="button" variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}{busy ? "Uploading…" : "Add video"}
          </Button>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
      <p className="mt-1 text-xs text-muted">MP4 or WebM, up to 50 MB. Only publish footage you have the right to share, and get consent before showing identifiable people, especially children. Save the event to attach the video.</p>
      {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
    </fieldset>
  );
}
