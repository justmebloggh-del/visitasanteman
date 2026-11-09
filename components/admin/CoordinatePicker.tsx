"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { STYLE } from "@/components/maps/MapView";

/**
 * Click-to-place coordinates for the latitude and longitude inputs above it. The inputs stay the source of truth
 * (they are what is submitted and validated); the map only fills them in and follows them.
 * Place a pin only on a spot you have verified: a click is not a survey.
 */
function Picker({ latId, lngId }: { latId: string; lngId: string }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lat = document.getElementById(latId) as HTMLInputElement | null;
    const lng = document.getElementById(lngId) as HTMLInputElement | null;
    if (!el.current || !lat || !lng) return;
    const read = (): [number, number] | null => {
      const a = Number(lat.value), b = Number(lng.value);
      return lat.value !== "" && lng.value !== "" && Math.abs(a) <= 90 && Math.abs(b) <= 180 ? [b, a] : null;
    };
    const start = read();
    const map = new maplibregl.Map({ container: el.current, style: STYLE, center: start ?? [-1.6, 6.7], zoom: start ? 13 : 8 });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    let marker: maplibregl.Marker | null = null;
    const place = (pos: [number, number]) => {
      if (!marker) {
        marker = new maplibregl.Marker({ color: "#174b35", draggable: true }).setLngLat(pos).addTo(map);
        marker.on("dragend", () => { const p = marker!.getLngLat(); fill(p.lat, p.lng); });
      } else marker.setLngLat(pos);
    };
    const fill = (la: number, lo: number) => {
      lat.value = la.toFixed(6); lng.value = lo.toFixed(6);
      lat.dispatchEvent(new Event("input", { bubbles: true })); lng.dispatchEvent(new Event("input", { bubbles: true }));
    };
    if (start) place(start);
    map.on("click", (e) => { place([e.lngLat.lng, e.lngLat.lat]); fill(e.lngLat.lat, e.lngLat.lng); });
    const follow = () => { const p = read(); if (p) { place(p); map.easeTo({ center: p }); } };
    lat.addEventListener("change", follow); lng.addEventListener("change", follow);
    return () => { lat.removeEventListener("change", follow); lng.removeEventListener("change", follow); map.remove(); };
  }, [latId, lngId]);

  return (
    <div className="sm:col-span-2">
      <p className="mb-2 text-sm font-medium text-ink">Set the location on the map</p>
      <div ref={el} className="h-72 w-full overflow-hidden rounded-xl border border-line" role="region" aria-label="Map for choosing coordinates" />
      <p className="mt-2 text-xs text-muted">Click the map or drag the pin to fill latitude and longitude. Only place a pin where you have confirmed the location on site or from an official source.</p>
    </div>
  );
}

export const CoordinatePicker = dynamic(() => Promise.resolve(Picker), { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-xl bg-forest-soft sm:col-span-2" aria-label="Loading map" /> });
