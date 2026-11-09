export interface PlanItem {
  id: string; day: number; sort_order: number;
  item_type: "attraction" | "listing" | "experience" | "event" | "community" | "custom";
  item_id: string | null; note: string | null; title: string | null; href: string | null;
  lat: number | null; lng: number | null; unavailable: boolean;
}

export interface PlanView {
  id: string; title: string; start_date: string | null; days: number; travellers: number;
  interests: string[]; notes: string | null; shared: boolean; items: PlanItem[];
}

/** Map marker kind from an item's public path. */
export function kindFromHref(href: string | null): "attraction" | "community" | "accommodation" | "restaurant" | "business" | "event" | "experience" | "education" | "sports" | "transport" {
  if (!href) return "attraction";
  if (href.startsWith("/accommodation")) return "accommodation";
  if (href.startsWith("/restaurants")) return "restaurant";
  if (href.startsWith("/business") || href.startsWith("/venues") || href.startsWith("/markets")) return "business";
  if (href.startsWith("/experiences")) return "experience";
  if (href.startsWith("/events")) return "event";
  if (href.startsWith("/communities")) return "community";
  return "attraction";
}
