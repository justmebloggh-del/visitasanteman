import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SUPABASE_URL } from "@/lib/env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Public URL of a file in the 'media' storage bucket. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path || !SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}

export function formatPrice(amount: number | null | undefined, currency = "GHS"): string | null {
  if (amount == null) return null;
  return new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

/** Ghana is UTC+0 all year, so event times are shown in UTC. */
export function formatDate(iso: string, withTime = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatDuration(minutes: number | null | undefined): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function whatsappLink(number: string | null | undefined, text?: string): string | null {
  const digits = (number ?? "").replace(/\D/g, "");
  if (digits.length < 9) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function directionsLink(lat: number | null, lng: number | null): string | null {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Only allow http(s) links from user-managed data. */
export function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** The current time in milliseconds. A function so server pages can read the clock without tripping the render-purity lint rule. */
export const nowMs = () => Date.now();

/** An event date as text. Dates are facts only once an administrator has verified them for this occurrence. */
export function eventDateText(ev: { starts_at: string; date_verified?: boolean }, withTime = false): string {
  return ev.date_verified ? formatDate(ev.starts_at, withTime) : "Date to be confirmed";
}
