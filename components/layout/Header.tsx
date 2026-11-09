"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { ButtonLink } from "@/components/ui";
import { mainNav, planVisit, siteConfig } from "@/config/site";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label={`${siteConfig.displayName}, home`}>
          <Wordmark />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/search" aria-label="Search" className="grid size-10 place-items-center rounded-full hover:bg-forest-soft">
            <Search className="size-5 text-forest" />
          </Link>
          <ButtonLink href={planVisit.href} size="sm" className="hidden sm:inline-flex">{planVisit.label}</ButtonLink>
          <div className="hidden sm:block"><AccountMenu /></div>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full hover:bg-forest-soft xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6 text-forest" /> : <Menu className="size-6 text-forest" />}
          </button>
        </div>
      </div>

      {/* Full menu bar: wide screens only. Smaller screens use the menu button. */}
      <nav aria-label="Main" className="hidden border-t border-line bg-white xl:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {mainNav.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
                className={cn("whitespace-nowrap border-b-2 border-transparent px-2 py-2.5 text-[13px] font-medium text-ink/80 hover:text-forest",
                  active && "border-gold text-forest")}>
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-white px-4 pb-10 pt-4 xl:hidden">
          <ButtonLink href={planVisit.href} onClick={() => setOpen(false)} className="w-full">{planVisit.label}</ButtonLink>
          <nav aria-label="Mobile" className="mt-2 flex flex-col">
            {mainNav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-lg font-medium text-forest">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6"><AccountMenu stacked /></div>
        </div>
      )}
    </header>
  );
}
