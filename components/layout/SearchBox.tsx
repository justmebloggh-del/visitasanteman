"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Suggestion { title: string; href: string; type: string; area: string | null }

/** A plain GET form (works without JavaScript) with optional autocomplete from the public search API. */
export function SearchBox({ className, defaultValue }: { className?: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const box = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) { setItems(((await res.json()) as { suggestions: Suggestion[] }).suggestions); setOpen(true); }
      } catch { /* aborted or offline: the plain form still works */ }
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [value]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const show = open && value.trim().length >= 2 && items.length > 0;
  return (
    <form ref={box} action="/search" role="search" className={cn("relative flex gap-2 rounded-full bg-white p-1.5 shadow-lg", className)}>
      <label htmlFor="site-search" className="sr-only">What would you like to discover in Asanteman?</label>
      <input
        id="site-search" name="q" type="search" value={value} autoComplete="off" placeholder="What would you like to discover in Asanteman?"
        onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        className="min-w-0 flex-1 rounded-full bg-transparent px-4 text-sm text-ink placeholder:text-muted/70 focus:outline-none"
      />
      <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white hover:bg-forest-dark">
        <Search className="size-4" aria-hidden />Search
      </button>
      {show && (
        <ul id={listId} aria-label="Search suggestions" className="absolute inset-x-2 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-white text-left shadow-xl">
          {items.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm text-ink hover:bg-forest-soft">
                <span className="font-medium">{s.title}</span>
                <span className="shrink-0 text-xs text-muted">{s.type}{s.area ? ` · ${s.area}` : ""}</span>
              </Link>
            </li>
          ))}
          <li className="border-t border-line px-4 py-2 text-xs text-muted">Press Search for all results</li>
        </ul>
      )}
    </form>
  );
}
