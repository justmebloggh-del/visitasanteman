import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/env";
import { getCeremony } from "@/lib/content/public";

export const revalidate = 60;

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** A calendar file for confirmed dates only. Unconfirmed dates are never turned into calendar entries. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const c = await getCeremony((await params).slug);
  if (!c || !c.date_confirmed || !c.starts_at) return new NextResponse("No confirmed date", { status: 404 });
  const end = c.ends_at ?? new Date(new Date(c.starts_at).getTime() + 3 * 3600_000).toISOString();
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VisitAsanteman//Ceremonies//EN", "BEGIN:VEVENT",
    `UID:${c.id}@visitasanteman`, `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(c.starts_at)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(c.name)}`, ...(c.summary ? [`DESCRIPTION:${esc(c.summary)}`] : []), `URL:${SITE_URL}/culture/ceremonies/${c.slug}`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  return new NextResponse(lines.join("\r\n") + "\r\n", {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${c.slug}.ics"` },
  });
}
