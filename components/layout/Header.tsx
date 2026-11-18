"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { ButtonLink } from "@/components/ui";
import { DesktopNav, MobileNav, type NavDistrict } from "@/components/layout/MainNav";
import { planVisit } from "@/config/site";
import { AccountMenu } from "@/components/layout/AccountMenu";

export function Header({ districts = [] }: { districts?: NavDistrict[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold bg-white/95 backdrop-blur">
      {/* The top bar (logo, search, account) is coloured with the kente cloth; the menu bar below is unchanged. */}
      <div className="nav-kente">
      <div className="mx-auto flex h-14 max-w-7xl sm:h-[4.75rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="Visit Asanteman Homepage">
          <Wordmark animated />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/search" aria-label="Search" className="grid size-11 place-items-center rounded-full hover:bg-white/10">
            <Search className="size-5 text-white" />
          </Link>
          <ButtonLink href={planVisit.href} variant="accent" size="sm" className="hidden sm:inline-flex">{planVisit.label}</ButtonLink>
          <div className="hidden sm:block"><AccountMenu onDark /></div>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full hover:bg-white/10 xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6 text-white" /> : <Menu className="size-6 text-white" />}
          </button>
        </div>
      </div>
      </div>

      {/* Full menu bar: wide screens only. Smaller screens use the menu button. */}
      <nav aria-label="Main" className="hidden border-t border-line bg-white xl:block"><DesktopNav districts={districts} /></nav>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-14 h-[calc(100dvh-3.5rem)] sm:top-[4.75rem] sm:h-[calc(100dvh-4.75rem)] overflow-y-auto bg-white px-4 pb-10 pt-4 xl:hidden">
          <ButtonLink href={planVisit.href} onClick={() => setOpen(false)} className="w-full">{planVisit.label}</ButtonLink>
          <nav aria-label="Mobile"><MobileNav onNavigate={() => setOpen(false)} districts={districts} /></nav>
          <div className="mt-6"><AccountMenu stacked /></div>
        </div>
      )}
    </header>
  );
}
