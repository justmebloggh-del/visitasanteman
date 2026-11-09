"use client";

import { Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Input, Notice } from "@/components/ui";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { mediaUrl } from "@/lib/utils";

export interface MediaItem { id: string; path: string; alt_text: string }

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_INPUT = 15 * 1024 * 1024;     // reject huge originals before processing
const MAX_EDGE = 2000;                  // longest side after optimisation
const MAX_OUTPUT = 5 * 1024 * 1024;     // matches the storage bucket limit

/** Resize and re-encode to WebP in the browser so uploads are small and fast. */
async function optimise(file: File): Promise<{ blob: Blob; width: number; height: number; type: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale), height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.82));
  bitmap.close();
  if (!blob) throw new Error("Could not process the image");
  return { blob, width, height, type: "image/webp" };
}

export function ImageUploader({ name, label, multiple, initial, folder = "general", hint, max }: {
  name: string; label: string; multiple?: boolean; initial: MediaItem[]; folder?: string; hint?: string; max?: number;
}) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    if (!alt.trim()) { setError("Describe the image first (alt text). It is read aloud to people using screen readers."); if (fileInput.current) fileInput.current.value = ""; return; }
    if (multiple && max != null && items.length + files.length > max) {
      setError(`Your plan allows up to ${max} photos here. Remove one or ask us about upgrading.`);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setBusy(true);
    try {
      const supabase = createBrowserSupabase();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Your session has expired. Please log in again.");
      const added: MediaItem[] = [];
      for (const file of Array.from(files).slice(0, multiple ? 20 : 1)) {
        if (!ALLOWED.includes(file.type)) throw new Error(`${file.name}: only JPEG, PNG, WebP or AVIF images are allowed`);
        if (file.size > MAX_INPUT) throw new Error(`${file.name}: file is larger than 15 MB`);
        const out = await optimise(file);
        if (out.blob.size > MAX_OUTPUT) throw new Error(`${file.name}: still over 5 MB after optimising`);
        const path = `${folder}/${crypto.randomUUID()}.webp`;
        const up = await supabase.storage.from("media").upload(path, out.blob, { contentType: out.type, upsert: false });
        if (up.error) throw new Error(`Upload failed: ${up.error.message}`);
        const { data, error: dbErr } = await supabase.from("media").insert({
          path, alt_text: alt.trim(), mime_type: out.type, size_bytes: out.blob.size, width: out.width, height: out.height, folder, uploaded_by: auth.user.id,
        }).select("id,path,alt_text").single();
        if (dbErr || !data) {
          await supabase.storage.from("media").remove([path]); // do not leave an orphaned file
          throw new Error(`Could not save the image record${dbErr ? `: ${dbErr.message}` : ""}`);
        }
        added.push(data);
      }
      setItems((prev) => (multiple ? [...prev, ...added] : added));
      setAlt("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <fieldset className="rounded-xl border border-line p-4">
      <legend className="px-1 text-sm font-medium text-ink">{label}</legend>
      <input type="hidden" name={name} value={items.map((i) => i.id).join(",")} />
      {items.length > 0 && (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((i) => (
            <li key={i.id} className="group relative overflow-hidden rounded-lg border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(i.path) ?? ""} alt={i.alt_text} className="aspect-square w-full object-cover" />
              <button type="button" onClick={() => setItems((p) => p.filter((x) => x.id !== i.id))} aria-label={`Remove ${i.alt_text || "image"}`}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/95 text-red-700 shadow hover:bg-white"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label htmlFor={`${name}-alt`} className="mb-1.5 block text-xs font-medium text-muted">Image description (alt text) for the next upload</label>
          <Input id={`${name}-alt`} value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} placeholder="e.g. Fishermen on the lake at sunrise" />
        </div>
        <div>
          <input ref={fileInput} type="file" accept={ALLOWED.join(",")} multiple={multiple} className="sr-only" id={`${name}-file`} onChange={(e) => onFiles(e.target.files)} disabled={busy} />
          <Button type="button" variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}{busy ? "Uploading…" : multiple ? "Add images" : items.length ? "Replace image" : "Upload image"}
          </Button>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
      <p className="mt-1 text-xs text-muted">Images are resized (max 2000 px) and converted to WebP automatically.</p>
      {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
    </fieldset>
  );
}
