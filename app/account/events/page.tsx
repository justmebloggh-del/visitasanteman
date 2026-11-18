import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelRegistration } from "@/app/actions/account";
import { Notice, Button, ButtonLink } from "@/components/ui";
import { StatusBadge } from "@/components/admin/ui";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My events", robots: { index: false } };
const one = <T,>(x: T | T[] | null | undefined): T | null => (Array.isArray(x) ? x[0] ?? null : x ?? null);

export default async function MyEvents({ searchParams }: { searchParams: Promise<{ cancelled?: string; error?: string }> }) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/events");
  const { data } = await (await createClient()).from("event_registrations").select("id,status,guests,created_at,event:event_id(title,slug,starts_at,venue)").order("created_at", { ascending: false });
  type Ev = { title: string; slug: string; starts_at: string; venue: string | null };
  const rows = (data ?? []) as unknown as { id: string; status: string; guests: number; created_at: string; event: Ev | Ev[] | null }[];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-2xl font-semibold text-forest">Events I registered for</h2><ButtonLink href="/events" variant="accent">Find events</ButtonLink></div>
      {sp.cancelled && <Notice tone="success">Your registration is cancelled.</Notice>}
      {sp.error && <Notice tone="error">That did not work. Please try again.</Notice>}
      <p className="text-sm text-muted">Registrations made with your account email address ({user.email}) appear here.</p>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-muted">You have not registered for any events yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const e = one(r.event);
            return (
              <li key={r.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-forest">{e ? <Link href={`/events/${e.slug}`} className="hover:underline">{e.title}</Link> : "Event"}</p>
                    <p className="text-sm text-muted">{e ? `${formatDate(e.starts_at)}${e.venue ? ` · ${e.venue}` : ""}` : ""} · {r.guests} {r.guests === 1 ? "guest" : "guests"}</p>
                  </div>
                  <StatusBadge value={r.status} />
                </div>
                {r.status === "registered" && <form action={cancelRegistration.bind(null, r.id)} className="mt-3"><Button type="submit" size="sm" variant="outline">Cancel my registration</Button></form>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
