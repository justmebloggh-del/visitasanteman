"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { mainNav, type NavChild, type NavItem } from "@/config/site";
import { cn } from "@/lib/utils";

export interface NavDistrict { slug: string; name: string; kind: "metropolitan" | "municipal" | "district" }
const KIND_HEADINGS = { metropolitan: "Metropolitan", municipal: "Municipal", district: "District" } as const;
const groupedDistricts = (ds: NavDistrict[]) => (["metropolitan", "municipal", "district"] as const).map((k) => ({ kind: k, items: ds.filter((d) => d.kind === k) })).filter((g) => g.items.length);

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
const groupActive = (pathname: string, item: NavItem) => (item.href ? isActive(pathname, item.href) : !!item.children?.some((c) => isActive(pathname, c.href)));

/**
 * Desktop menu. Groups are disclosure buttons (aria-expanded): Enter, Space or the Down arrow opens one, Escape closes it and
 * returns focus to its button, Tab moves through its links, and moving focus out or clicking elsewhere closes it.
 */
export function DesktopNav({ districts }: { districts: NavDistrict[] }) {
  const pathname = usePathname();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const root = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpenKey(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <ul ref={root} className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      {mainNav.map((n) => (n.children ? <Group key={n.label} item={n} districts={districts} open={openKey === n.label} setOpen={(v) => setOpenKey(v ? n.label : null)} pathname={pathname} /> : (
        <li key={n.label}>
          <Link href={n.href!} aria-current={isActive(pathname, n.href!) ? "page" : undefined}
            className={cn("block whitespace-nowrap border-b-2 border-transparent px-2 py-2.5 text-[13px] font-medium text-ink/80 hover:text-forest", isActive(pathname, n.href!) && "border-gold text-forest")}>
            {n.label}
          </Link>
        </li>
      )))}
    </ul>
  );
}

function Group({ item, districts, open, setOpen, pathname }: { item: NavItem; districts: NavDistrict[]; open: boolean; setOpen: (v: boolean) => void; pathname: string }) {
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLUListElement>(null);
  const active = groupActive(pathname, item);
  return (
    <li className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}
      onKeyDown={(e) => { if (e.key === "Escape" && open) { setOpen(false); btn.current?.focus(); } }}>
      <button ref={btn} type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); requestAnimationFrame(() => panel.current?.querySelector("a")?.focus()); } }}
        className={cn("flex items-center gap-1 whitespace-nowrap border-b-2 border-transparent px-2 py-2.5 text-[13px] font-medium text-ink/80 hover:text-forest", active && "border-gold text-forest")}>
        {item.label}<ChevronDown className={cn("size-3.5 transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
      </button>
      <ul ref={panel} id={id} hidden={!open} className="absolute left-0 top-full z-50 min-w-56 rounded-b-xl border border-line bg-white py-2 shadow-lg">
        {item.children!.map((c) => c.districts ? (
          <DistrictSubmenu key={c.href} item={c} districts={districts} pathname={pathname} close={() => setOpen(false)} />
        ) : (
          <li key={c.href}>
            <Link href={c.href} aria-current={isActive(pathname, c.href) ? "page" : undefined} onClick={() => setOpen(false)}
              className={cn("block px-4 py-2 text-sm text-ink/90 hover:bg-forest-soft hover:text-forest", isActive(pathname, c.href) && "font-medium text-forest")}>{c.label}</Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

/** Nested desktop submenu: "Browse by district" opens a panel listing every district, grouped by type. */
function DistrictSubmenu({ item, districts, pathname, close }: { item: NavChild; districts: NavDistrict[]; pathname: string; close: () => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const groups = groupedDistricts(districts);
  return (
    <li className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => { if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); btn.current?.focus(); } }}>
      <button ref={btn} type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}
        className={cn("flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-ink/90 hover:bg-forest-soft hover:text-forest", isActive(pathname, item.href) && "font-medium text-forest")}>
        {item.label}<ChevronRight className="size-4" aria-hidden />
      </button>
      <div id={id} hidden={!open} className="absolute left-full top-0 z-50 -ml-px max-h-[75vh] w-[46rem] overflow-y-auto rounded-xl border border-line bg-white p-4 shadow-lg">
        <Link href={item.href} onClick={close} className="mb-3 inline-block text-sm font-medium text-forest underline underline-offset-2 hover:no-underline">All districts of Asanteman</Link>
        {groups.length > 0 ? (
          <div className="grid grid-cols-3 gap-x-5 gap-y-4">
            {groups.map((g) => (
              <div key={g.kind} className={g.kind === "metropolitan" ? "" : undefined}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">{KIND_HEADINGS[g.kind]} ({g.items.length})</p>
                <ul>
                  {g.items.map((d) => (
                    <li key={d.slug}><Link href={`/districts/${d.slug}`} onClick={close} aria-current={isActive(pathname, `/districts/${d.slug}`) ? "page" : undefined}
                      className="block rounded px-1.5 py-1 text-[13px] leading-snug text-ink/90 hover:bg-forest-soft hover:text-forest">{d.name}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted">Districts are being added.</p>}
      </div>
    </li>
  );
}

/** Mobile menu: the same groups as an accordion (each group is a button that shows or hides its links). */
export function MobileNav({ onNavigate, districts }: { onNavigate: () => void; districts: NavDistrict[] }) {
  const pathname = usePathname();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const base = useId();
  return (
    <ul className="mt-2 flex flex-col">
      {mainNav.map((n, i) => (
        <li key={n.label} className="border-b border-line">
          {n.children ? (
            <>
              <button type="button" aria-expanded={openKey === n.label} aria-controls={`${base}-${i}`} onClick={() => setOpenKey(openKey === n.label ? null : n.label)}
                className="flex w-full items-center justify-between py-3.5 text-left text-lg font-medium text-forest">
                {n.label}<ChevronDown className={cn("size-5 transition-transform motion-reduce:transition-none", openKey === n.label && "rotate-180")} aria-hidden />
              </button>
              <ul id={`${base}-${i}`} hidden={openKey !== n.label} className="pb-2 pl-3">
                {n.children.map((c) => c.districts ? (
                  <MobileDistricts key={c.href} item={c} districts={districts} onNavigate={onNavigate} />
                ) : (
                  <li key={c.href}><Link href={c.href} onClick={onNavigate} aria-current={isActive(pathname, c.href) ? "page" : undefined} className="block py-2.5 text-base text-ink/90">{c.label}</Link></li>
                ))}
              </ul>
            </>
          ) : (
            <Link href={n.href!} onClick={onNavigate} aria-current={isActive(pathname, n.href!) ? "page" : undefined} className="block py-3.5 text-lg font-medium text-forest">{n.label}</Link>
          )}
        </li>
      ))}
    </ul>
  );
}

function MobileDistricts({ item, districts, onNavigate }: { item: NavChild; districts: NavDistrict[]; onNavigate: () => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-2.5 text-left text-base text-ink/90">
        {item.label}<ChevronDown className={cn("size-4 transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
      </button>
      <div id={id} hidden={!open} className="pb-2 pl-3">
        <Link href={item.href} onClick={onNavigate} className="block py-2 text-sm font-medium text-forest underline underline-offset-2">All districts of Asanteman</Link>
        {groupedDistricts(districts).map((g) => (
          <div key={g.kind} className="mt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">{KIND_HEADINGS[g.kind]} ({g.items.length})</p>
            <ul>{g.items.map((d) => <li key={d.slug}><Link href={`/districts/${d.slug}`} onClick={onNavigate} className="block py-1.5 text-sm text-ink/90">{d.name}</Link></li>)}</ul>
          </div>
        ))}
      </div>
    </li>
  );
}
