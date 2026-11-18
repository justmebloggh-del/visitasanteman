"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, CalendarCheck, ClipboardList, LayoutDashboard, Map as MapIcon, ShieldCheck, Ticket, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = { overview: LayoutDashboard, profile: UserRound, bookings: Ticket, events: CalendarCheck, applications: ClipboardList, saved: Bookmark, plans: MapIcon, security: ShieldCheck };
export type NavKey = keyof typeof ICONS;
export interface NavItem { key: NavKey; href: string; label: string; count?: number }

/**
 * Account navigation: a row of pills you can swipe on phones, a sidebar on larger screens. The current page is marked with
 * aria-current and a clear colour; counts show how much is in each part.
 */
export function AccountNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/account" ? pathname === "/account" : pathname === href || pathname.startsWith(href + "/"));
  return (
    <nav aria-label="My account" className="min-w-0 lg:sticky lg:top-36">
      <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {items.map((it) => {
          const Icon = ICONS[it.key];
          const on = active(it.href);
          return (
            <li key={it.key} className="snap-start shrink-0 lg:shrink">
              <Link href={it.href} aria-current={on ? "page" : undefined}
                className={cn("flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors lg:rounded-xl lg:border-0 lg:px-3",
                  on ? "border-forest bg-forest text-white" : "border-line bg-white text-forest hover:bg-forest-soft lg:bg-transparent")}>
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">{it.label}</span>
                {typeof it.count === "number" && it.count > 0 && (
                  <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs", on ? "bg-white/20 text-white" : "bg-forest-soft text-forest")}>{it.count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
