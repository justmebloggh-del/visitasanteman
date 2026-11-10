import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * The one place the site's logo is rendered (header, footer, sign-in pages).
 * Emblem (hills, sun and water inside a gold ring) beside a stacked VISIT / ASANTEMAN wordmark.
 * The emblem is decorative; the readable name and tagline come from the text.
 */
function Emblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden focusable="false" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="va-emblem-clip"><circle cx="60" cy="60" r="56" /></clipPath>
      </defs>
      <g clipPath="url(#va-emblem-clip)">
        <rect width="120" height="120" fill="#0A0A0A" />
        <polygon points="0,86 0,50 28,34 54,86" fill="#1F6A47" />
        <polygon points="120,86 120,50 92,34 66,86" fill="#1F6A47" />
        <circle cx="60" cy="56" r="15" fill="#D5A642" />
        <path d="M0 86 L10 80 L20 86 L30 80 L40 86 L50 80 L60 86 L70 80 L80 86 L90 80 L100 86 L110 80 L120 86 L120 120 L0 120 Z" fill="#174B35" />
        <polyline points="0,86 10,80 20,86 30,80 40,86 50,80 60,86 70,80 80,86 90,80 100,86 110,80 120,86" fill="none" stroke="#D5A642" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M14 102 Q24 96 34 102 T54 102 T74 102 T94 102 T106 102" fill="none" stroke="#F5F7F3" strokeWidth="3" strokeLinecap="round" />
        <path d="M30 113 Q40 108 50 113 T70 113 T90 113" fill="none" stroke="#D5A642" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx="60" cy="60" r="56" fill="none" stroke="#D5A642" strokeWidth="4" />
    </svg>
  );
}

export function Wordmark({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Emblem className="size-11 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className={cn("pl-0.5 text-[0.65rem] font-bold uppercase tracking-[0.5em]", tone === "light" ? "text-gold" : "text-forest")}>Visit</span>
        <span className={cn("mt-1 text-xl font-extrabold tracking-wide", tone === "light" ? "text-white" : "text-ink")}>ASANTEMAN</span>
      </span>
      <span className="sr-only"> {siteConfig.tagline}</span>
    </span>
  );
}
