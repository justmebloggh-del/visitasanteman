import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * The one place the site's logo is rendered (header, footer, sign-in pages).
 * Until an official VisitAsanteman logo exists this is a plain text wordmark in the brand colours.
 * To use a real logo later, replace the body of this component with an <Image> of the new file
 * (for example /brand/visitasanteman-logo.svg); no other file needs to change.
 */
export function Wordmark({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline font-serif text-2xl font-semibold leading-none tracking-tight", className)}>
      <span className={tone === "light" ? "text-white" : "text-forest"}>Visit</span>
      <span className={tone === "light" ? "text-gold" : "text-gold-dark"}>Asanteman</span>
      <span className="sr-only"> {siteConfig.tagline}</span>
    </span>
  );
}
