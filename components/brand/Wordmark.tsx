import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The one place the site's logo is rendered (header, footer, sign-in pages).
 * The logo is the round VISIT ASANTEMAN badge (public/brand/logo.png, cut from public/new-logo.jpeg); the name is already
 * written inside it, so there is no separate wordmark. The logo image carries the readable name as its alt text.
 */
export function Wordmark({ className, size = "md", animated }: { tone?: "dark" | "light"; className?: string; size?: "md" | "lg"; /** Entrance, glow and shimmer (header only). */ animated?: boolean }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <span className={cn("rounded-full", animated && "logo-anim")}>
        <Image
          src="/brand/logo.png" alt="VisitAsanteman logo" width={512} height={512} priority={animated} sizes={size === "lg" ? "7rem" : "4rem"}
          className={cn("shrink-0 rounded-full object-contain", size === "lg" ? "size-28" : "size-11 sm:size-16")}
        />
      </span>
    </span>
  );
}
