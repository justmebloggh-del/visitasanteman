import { Banner } from "@/components/banners/Banner";
import type { BannerKey } from "@/config/banners";
import { getBanner } from "@/lib/content/banners";

/** One banner by key, with the administrator's edits. Renders nothing when it is switched off in Admin, Banners. Pages use PageTop. */
export async function SectionBanner({ k, as, className, crumbs }: { k: BannerKey; as?: "h1" | "h2"; className?: string; crumbs?: { label: string; href?: string }[] }) {
  const def = await getBanner(k);
  return def ? <Banner def={def} as={as} className={className} crumbs={crumbs} /> : null;
}
