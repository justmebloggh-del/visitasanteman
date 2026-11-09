"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  ["/partner/dashboard", "Dashboard"], ["/partner/listings", "My listings"], ["/partner/bookings", "Bookings"], ["/partner/enquiries", "Enquiries"], ["/partner/reviews", "Reviews"],
  ["/partner/subscription", "Subscription"], ["/partner/settings", "Settings"],
];

export function PartnerNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Partner portal" className="flex gap-1 overflow-x-auto border-b border-line bg-white px-4 sm:px-8">
      {items.map(([href, label]) => (
        <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined}
          className={cn("whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium", pathname.startsWith(href) ? "border-forest text-forest" : "border-transparent text-muted hover:text-forest")}>{label}</Link>
      ))}
    </nav>
  );
}
