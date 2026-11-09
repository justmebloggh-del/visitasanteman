import { NextResponse } from "next/server";
import { getSessionUser, isStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !isStaff(user.role)) return new NextResponse("Forbidden", { status: 403 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("newsletter_subscribers").select("email,source,subscribed_at").is("unsubscribed_at", null).order("subscribed_at");
  if (error) return new NextResponse("Export failed", { status: 500 });
  // Prefix cells that start with = + - @ so spreadsheets cannot run them as formulas.
  const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
  const csv = ["email,source,subscribed_at", ...(data ?? []).map((r) => [cell(r.email), cell(r.source), cell(r.subscribed_at)].join(","))].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="newsletter-subscribers.csv"' } });
}
