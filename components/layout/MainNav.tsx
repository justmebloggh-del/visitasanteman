"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { mainNav, type NavItem } from "@/config/site";
import { cn } from "@/lib/utils";

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
const groupActive = (pathname: string, item: NavItem) => (item.href ? isActive(pathname, item.href) : !!item.children?.some((c) => isActive(pathname, c.href)));

/**
 * Desktop menu. Groups are disclosure buttons (aria-expanded): Enter, Space or the Down arrow opens one, Escape closes it and
 * returns focus to its button, Tab moves through its links, and moving focus out or clicking elsewhere closes it.
 */
export function DesktopNav() {
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
      {mainNav.map((n) => (n.children ? <Group key={n.label} item={n} open={openKey === n.label} setOpen={(v) => setOpenKey(v ? n.label : null)} pathname={pathname} /> : (
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

function Group({ item, open, setOpen, pathname }: { item: NavItem; open: boolean; setOpen: (v: boolean) => void; pathname: string }) {
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
        {item.children!.map((c) => (
          <li key={c.href}>
            <Link href={c.href} aria-current={isActive(pathname, c.href) ? "page" : undefined} onClick={() => setOpen(false)}
              className={cn("block px-4 py-2 text-sm text-ink/90 hover:bg-forest-soft hover:text-forest", isActive(pathname, c.href) && "font-medium text-forest")}>{c.label}</Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

/** Mobile menu: the same groups as an accordion (each group is a button that shows or hides its links). */
export function MobileNav({ onNavigate }: { onNavigate: () => void }) {
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
                {n.children.map((c) => (
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
