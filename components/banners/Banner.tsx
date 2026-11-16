import { BannerShell } from "@/components/banners/BannerShell";
import { Breadcrumbs } from "@/components/layout/blocks";
import type { BannerDef } from "@/config/banners";

/** A page banner: the shared shell with this banner's headline, message and weave (set in config/banners.ts, editable in Admin, Banners). */
export function Banner({ def, as, crumbs, className }: { def: BannerDef; as?: "h1" | "h2"; crumbs?: { label: string; href?: string }[]; className?: string }) {
  return <BannerShell id={`banner-${def.key}`} as={as} title={def.headline} message={def.message} pattern={def.style.pattern} motion={def.style.motion} crumbs={crumbs && <Breadcrumbs items={crumbs} />} className={className} />;
}
