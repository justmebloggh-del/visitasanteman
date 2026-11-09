import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/utils/rate-limit";
import { searchKindLabels, searchSite } from "@/lib/search";

export const dynamic = "force-dynamic";

/** Autocomplete: the top few published matches. Public data only; rate limited per visitor. */
export async function GET(req: Request) {
  if (!(await rateLimit("suggest", 120, 60_000))) return NextResponse.json({ suggestions: [] }, { status: 429 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json({ suggestions: [] });
  const { hits } = await searchSite(q, { limit: 8 });
  return NextResponse.json({
    suggestions: hits.map((h) => ({ title: h.title, href: h.href, type: searchKindLabels[h.kind] ?? h.kind, area: h.area_name })),
  }, { headers: { "cache-control": "no-store" } });
}
