import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import { safeUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Counts the click, then sends the visitor to the advertiser. Only active ads (per RLS) redirect; the target must be http(s). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const home = new URL("/", request.url);
  if (!supabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(home);
  const db = createPublicClient();
  const { data } = await db.from("advertisements").select("link_url").eq("id", id).maybeSingle();
  const target = safeUrl(data?.link_url);
  if (!target) return NextResponse.redirect(home);
  await db.rpc("record_ad_event", { p_ad: id, p_event: "click" });
  return NextResponse.redirect(target, 302);
}
