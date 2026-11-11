"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import type { Map as MlMap } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn, directionsLink } from "@/lib/utils";
import type { MapPoint } from "@/types/content";

// The default worker URL is mangled by the bundler; load it from our own origin (see scripts/copy-maplibre-worker.mjs).
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const KIND_LABEL: Record<MapPoint["kind"], string> = {
  attraction: "Attractions", community: "Communities", accommodation: "Accommodation",
  restaurant: "Restaurants", business: "Businesses", experience: "Experiences", event: "Events",
  education: "Education", sports: "Sports venues", transport: "Transport",
};
const KIND_COLOR: Record<MapPoint["kind"], string> = {
  attraction: "#174b35", community: "#8b6845", accommodation: "#287d9b", restaurant: "#d5a642",
  business: "#5d6b64", experience: "#1d6580", event: "#b4552d",
  education: "#6a4c93", sports: "#2f7d32", transport: "#3d5a80",
};

export const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export function MapView({ points, center, zoom = 11, filters = false, className }: {
  points: MapPoint[]; center: [number, number]; zoom?: number; filters?: boolean; className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const kinds = useMemo(() => Array.from(new Set(points.map((p) => p.kind))), [points]);
  const [active, setActive] = useState<Set<MapPoint["kind"]>>(new Set(kinds));
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"map" | "list">("map");

  useEffect(() => {
    if (!container.current || map.current) return;
    const m = new maplibregl.Map({ container: container.current, style: STYLE, center, zoom });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.addControl(new maplibregl.GeolocateControl({}), "top-right");
    map.current = m;
    return () => { m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(
    () => points.filter((p) => active.has(p.kind) && p.title.toLowerCase().includes(query.trim().toLowerCase())),
    [points, active, query],
  );

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((x) => x.remove());
    markers.current = visible.map((p) => {
      const popup = new maplibregl.Popup({ offset: 14 });
      const wrap = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = p.title;
      const kind = document.createElement("div");
      kind.textContent = KIND_LABEL[p.kind].replace(/s$/, "");
      kind.style.cssText = "font-size:12px;color:#5d6b64;margin:2px 0 6px";
      const open = document.createElement("a");
      open.href = p.href; open.textContent = "View details"; open.style.cssText = "color:#1d6580;margin-right:10px";
      wrap.append(strong, kind, open);
      const dir = directionsLink(p.lat, p.lng);
      if (dir) {
        const d = document.createElement("a");
        d.href = dir; d.target = "_blank"; d.rel = "noopener noreferrer"; d.textContent = "Directions"; d.style.cssText = "color:#1d6580";
        wrap.append(d);
      }
      popup.setDOMContent(wrap);
      return new maplibregl.Marker({ color: KIND_COLOR[p.kind] }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(m);
    });
    if (visible.length > 1 && query) {
      const b = new maplibregl.LngLatBounds();
      visible.forEach((p) => b.extend([p.lng, p.lat]));
      m.fitBounds(b, { padding: 60, maxZoom: 15 });
    } else if (visible.length === 1) {
      m.flyTo({ center: [visible[0].lng, visible[0].lat], zoom: Math.max(m.getZoom(), 13) });
    }
  }, [visible, query]);

  // A hidden map has no size; tell it to measure itself again when it comes back.
  useEffect(() => { if (view === "map") map.current?.resize(); }, [view]);

  const toggle = (k: MapPoint["kind"]) =>
    setActive((prev) => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  return (
    <div className={cn("space-y-3", className)}>
      {filters && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="map-search">Search the map</label>
          <input id="map-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search places on the map"
            className="h-11 w-full rounded-lg border border-line px-3.5 text-sm sm:max-w-xs" />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Map categories">
            {kinds.map((k) => (
              <button key={k} type="button" onClick={() => toggle(k)} aria-pressed={active.has(k)}
                className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                  active.has(k) ? "border-forest bg-forest-soft text-forest" : "border-line text-muted")}>
                <span className="size-2.5 rounded-full" style={{ background: KIND_COLOR[k] }} aria-hidden />
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>
      )}
      {filters && (
        <div className="flex gap-2" role="group" aria-label="View">
          {(["map", "list"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}
              className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", view === v ? "border-forest bg-forest text-white" : "border-line text-muted")}>{v === "map" ? "Map" : "List"}</button>
          ))}
        </div>
      )}
      <div ref={container} className={cn("h-[420px] w-full overflow-hidden rounded-2xl border border-line sm:h-[560px]", view === "list" && "hidden")} role="region" aria-label="Interactive map" />
      {view === "list" && (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white" aria-label="Places on the map">
          {visible.length === 0 && <li className="p-5 text-sm text-muted">No places match.</li>}
          {visible.map((p) => {
            const dir = directionsLink(p.lat, p.lng);
            return (
              <li key={`${p.kind}-${p.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <span><a href={p.href} className="font-medium text-forest hover:underline">{p.title}</a> <span className="text-muted">· {KIND_LABEL[p.kind].replace(/s$/, "")}</span></span>
                {dir && <a href={dir} target="_blank" rel="noopener noreferrer" className="text-lake-dark underline">Directions</a>}
              </li>
            );
          })}
        </ul>
      )}
      {points.length === 0 && (
        <p className="text-sm text-muted">No places with verified coordinates have been added yet. The map shows Asanteman until they are.</p>
      )}
    </div>
  );
}
