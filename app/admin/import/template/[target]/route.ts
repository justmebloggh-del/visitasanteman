import { NextResponse } from "next/server";
import { getSessionUser, isStaff } from "@/lib/auth/session";
import { templates, toCsv, type ImportTarget } from "@/lib/import/csv";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ target: string }> }) {
  const user = await getSessionUser();
  if (!user || !isStaff(user.role)) return new NextResponse("Not allowed", { status: 403 });
  const { target } = await params;
  const t = templates[target as ImportTarget];
  if (!t) return new NextResponse("Unknown template", { status: 404 });
  return new NextResponse(toCsv([t.columns, t.example]), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="visitasanteman-${target}-template.csv"` },
  });
}
