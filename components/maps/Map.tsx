"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentProps } from "react";

/** MapLibre is large and needs the browser, so it is loaded client-side only. */
const MapView = dynamic(() => import("@/components/maps/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <MapPlaceholder label="Loading map" />,
});

function MapPlaceholder({ label }: { label: string }) {
  return <div className="h-[340px] w-full animate-pulse rounded-2xl bg-forest-soft sm:h-[560px]" role="img" aria-label={label} />;
}

/**
 * The map's code (about 200 KB) is fetched only when the map is about to scroll into view, so pages that show a map below the
 * first screen load faster on phones.
 */
export function Map(props: ComponentProps<typeof MapView>) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === "undefined") { const t = setTimeout(() => setNear(true), 0); return () => clearTimeout(t); }
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  return <div ref={ref}>{near ? <MapView {...props} /> : <MapPlaceholder label="Map, loads as you scroll" />}</div>;
}
