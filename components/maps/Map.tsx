"use client";

import dynamic from "next/dynamic";

/** MapLibre needs the browser, so it is loaded client-side only. */
export const Map = dynamic(() => import("@/components/maps/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full animate-pulse rounded-2xl bg-forest-soft sm:h-[560px]" aria-label="Loading map" />,
});
