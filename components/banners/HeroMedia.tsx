"use client";

import Image from "next/image";
import { useMedia } from "@/components/banners/useMedia";
import { images, type ImageKey } from "@/config/images";

/**
 * Centre panel of the homepage hero. A photograph always shows first. The short film (about 8 MB) is only fetched on wide
 * screens, for visitors who have not asked for reduced motion or a data saver, so phones never download it.
 */
export function HeroMedia({ fallbackKey, imageSrc, imageAlt }: { fallbackKey: ImageKey; imageSrc?: string | null; imageAlt?: string }) {
  const wide = useMedia("(min-width: 1024px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const saveData = !!(typeof navigator !== "undefined" && (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const film = wide && !reduced && !saveData;
  const fallback = images[fallbackKey];
  const src = imageSrc || fallback.src;
  return (
    <div className="banner-float relative aspect-[4/3] w-[26rem] max-w-full overflow-hidden rounded-xl border-4 border-gold bg-black/30 shadow-2xl">
      <Image src={src} alt={imageSrc ? (imageAlt ?? "") : ""} fill priority sizes="(min-width:1024px) 28rem, 90vw" unoptimized={src.startsWith("/")} className="object-cover" />
      {film && <video src="/hero-video.mp4" autoPlay muted loop playsInline preload="none" aria-hidden tabIndex={-1} className="absolute inset-0 size-full object-cover" />}
    </div>
  );
}
