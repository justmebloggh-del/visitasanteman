"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { mainNav } from "@/config/site";
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
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="Visit Lake Bosomtwe, home">
          <Image src="/brand/logo.png" alt="Visit Lake Bosomtwe" width={120} height={60} priority className="h-11 w-auto" />
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 min-[1400px]:flex">
          {mainNav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname.startsWith(n.href) ? "page" : undefined}
              className={cn("whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium text-ink/80 hover:bg-forest-soft hover:text-forest",
                pathname.startsWith(n.href) && "bg-forest-soft text-forest")}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/search" aria-label="Search" className="grid size-10 place-items-center rounded-full hover:bg-forest-soft">
            <Search className="size-5 text-forest" />
          </Link>
          <div className="hidden sm:block"><AccountMenu /></div>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full hover:bg-forest-soft min-[1400px]:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6 text-forest" /> : <Menu className="size-6 text-forest" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-white px-4 pb-10 pt-4 min-[1400px]:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {[{ href: "/", label: "Home" }, ...mainNav].map((n) => (
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
