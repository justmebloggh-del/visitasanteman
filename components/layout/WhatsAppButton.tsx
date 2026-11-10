"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/utils";

const HIDDEN_ON = ["/admin", "/partner", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/auth", "/booking", "/travel-planner", "/plan"];

/**
 * Floating "Chat on WhatsApp" link: a plain wa.me link, no third-party script, and nothing about the visitor is collected or sent.
 * Not shown without a number in settings, nor on admin, sign-in or booking screens where it could sit over a form.
 */
export function WhatsAppButton({ number }: { number?: string | null }) {
  const pathname = usePathname();
  const href = whatsappLink(number, "Hello VisitAsanteman, I would like help planning a visit.");
  if (!href || HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-[#1a7f45] px-4 text-sm font-medium text-white shadow-lg hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 sm:bottom-5">
      <MessageCircle className="size-5" aria-hidden />
      <span>Chat on WhatsApp<span className="sr-only"> (opens WhatsApp in a new tab)</span></span>
    </a>
  );
}
