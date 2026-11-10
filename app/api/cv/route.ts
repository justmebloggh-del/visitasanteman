import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Sends the signed-in user to a short-lived link for one CV. The application row is read with the
 * caller's own rights, so only the applicant, the receiving employer or an administrator can get one.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("application") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/api/cv?application=${id}`)}`, req.url));
  const { data: app } = await supabase.from("job_applications").select("cv_path").eq("id", id).maybeSingle();
  if (!app?.cv_path) return new NextResponse("Not found", { status: 404 });
  const { data, error } = await supabase.storage.from("cvs").createSignedUrl(app.cv_path, 60);
  if (error || !data) return new NextResponse("Not found", { status: 404 });
  const res = NextResponse.redirect(data.signedUrl);
  res.headers.set("Cache-Control", "private, no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
