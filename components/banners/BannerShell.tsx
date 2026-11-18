import { Container } from "@/components/ui";
import { SikaDwaEmblem } from "@/components/banners/SikaDwaEmblem";
import { cn } from "@/lib/utils";

/**
 * The one banner every page opens with, so all of them are the same size with the same type: a green and gold kente weave,
 * a breadcrumb, a serif title (same size as on About), a gold rule, an optional line of text, and the Sika Dwa emblem at the
 * far right. Pages differ only in their weave (a, b or c), their words and their entrance.
 */
export function BannerShell({ id, as: Heading = "h1", title, message, crumbs, pattern = "a", motion = "rise", className }: {
  id?: string; as?: "h1" | "h2"; title: string; message?: string; crumbs?: React.ReactNode;
  pattern?: "a" | "b" | "c"; motion?: "rise" | "slide" | "fade"; className?: string;
}) {
  return (
    <section className={cn("banner kente-bg gold-shimmer relative isolate overflow-hidden text-white", `kente-${pattern}`, className)} data-motion={motion} aria-labelledby={id}>
      <div className="kente-veil absolute inset-0 -z-10" aria-hidden />
      <div className="kente-strip" aria-hidden />
      <Container className="grid h-[12.5rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 py-4 sm:h-[19rem] sm:gap-x-8 sm:py-10">
        <div className="min-w-0">
          {crumbs && <div className="page-crumbs mb-2 sm:mb-4">{crumbs}</div>}
          <Heading id={id} className="banner-rise banner-rise-2 break-words font-serif line-clamp-3 text-[1.5rem] font-semibold leading-[1.15] sm:line-clamp-none sm:text-[2.85rem] sm:leading-tight">{title}</Heading>
          <span className="banner-rise banner-rise-2 mt-2.5 block h-[3px] w-12 sm:mt-4 sm:h-1 sm:w-[4.75rem] rounded-full bg-gold" aria-hidden />
          {message && <p className="banner-rise banner-rise-3 mt-2.5 line-clamp-2 max-w-2xl text-[0.84rem] leading-snug sm:mt-4 sm:text-[0.9rem] text-soft-gold sm:text-[1.07rem]">{message}</p>}
        </div>
        <SikaDwaEmblem className="justify-self-end self-center w-[3.25rem] sm:w-[6.65rem] lg:w-[8.55rem]" />
      </Container>
      <div className="kente-strip" aria-hidden />
    </section>
  );
}
