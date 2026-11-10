"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { ButtonLink } from "@/components/ui";
import { DesktopNav, MobileNav } from "@/components/layout/MainNav";
import { planVisit, siteConfig } from "@/config/site";
import { AccountMenu } from "@/components/layout/AccountMenu";

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label={`${siteConfig.name}, home`}>
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
      <nav aria-label="Main" className="hidden border-t border-line bg-white xl:block"><DesktopNav /></nav>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 h-[calc(100dvh-4rem)] overflow-y-auto bg-white px-4 pb-10 pt-4 xl:hidden">
          <ButtonLink href={planVisit.href} onClick={() => setOpen(false)} className="w-full">{planVisit.label}</ButtonLink>
          <nav aria-label="Mobile"><MobileNav onNavigate={() => setOpen(false)} /></nav>
          <div className="mt-6"><AccountMenu stacked /></div>
        </div>
      )}
    </header>
  );
}
