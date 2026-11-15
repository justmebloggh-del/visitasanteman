import { cache } from "react";
import { bannerKeys, resolveBanner, type BannerDef, type BannerKey } from "@/config/banners";
import { getSettings } from "@/lib/content/public";

const saved = cache(async () => (await getSettings()).banners as unknown);

/** A banner with the administrator's edits applied. Returns null when the banner is switched off. */
export async function getBanner(key: BannerKey): Promise<BannerDef | null> {
  const def = resolveBanner(key, await saved());
  return def.enabled ? def : null;
}

export async function getBanners(keys: BannerKey[] = bannerKeys): Promise<BannerDef[]> {
  const s = await saved();
  return keys.map((k) => resolveBanner(k, s)).filter((d) => d.enabled);
}
