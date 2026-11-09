"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { adminNav } from "@/config/admin-resources";
import { cn } from "@/lib/utils";

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  const list = (
    <nav aria-label="Admin" className="space-y-0.5 text-sm">
      {adminNav.filter((n) => role !== "media_manager" || ("href" in n && n.href === "/admin/media")).map((n, i) =>
        "group" in n ? (
          <p key={i} className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-white/50">{n.group}</p>
        ) : (
          <Link key={n.href} href={n.href} aria-current={pathname.startsWith(n.href) ? "page" : undefined}
            className={cn("block rounded-lg px-3 py-2 text-white/85 hover:bg-white/10", pathname.startsWith(n.href) && "bg-white/15 font-medium text-white")}>
            {n.label}
          </Link>
        ),
      )}
      <p className="px-3 pt-6 text-xs text-white/50">Signed in as {role.replace("_", " ")}</p>
      <Link href="/" className="block rounded-lg px-3 py-2 text-white/70 hover:bg-white/10">View website</Link>
    </nav>
  );
  return (
    <>
      <aside className="hidden w-60 shrink-0 bg-forest-dark p-4 md:block"><div className="sticky top-4">{list}</div></aside>
      <details className="bg-forest-dark text-white md:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-medium"><Menu className="size-5" aria-hidden />Admin menu</summary>
        <div className="px-4 pb-4">{list}</div>
      </details>
    </>
  );
}
