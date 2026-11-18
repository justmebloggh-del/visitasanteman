import Link from "next/link";
import { Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, nowMs } from "@/lib/utils";

/**
 * The admin's inbox: everything visitors send or sign up for, in one place, with what needs attention and the latest activity.
 * Each tile links to the page where the item is managed (status, reply, approve, export).
 */
export async function InboxPanel() {
  const supabase = await createClient();
  const since = new Date(nowMs() - 7 * 86_400_000).toISOString();
  const head = (table: string) => supabase.from(table).select("*", { count: "exact", head: true });

  const [enq, regs, noms, revs, users, subs, apps] = await Promise.all([
    head("enquiries").eq("status", "new"),
    head("event_registrations").gte("created_at", since).neq("status", "cancelled"),
    head("award_nominations").eq("status", "new"),
    head("reviews").eq("status", "pending"),
    head("profiles").gte("created_at", since),
    head("newsletter_subscribers").gte("subscribed_at", since).is("unsubscribed_at", null),
    head("job_applications").gte("created_at", since),
  ]);
  const n = (r: { count: number | null }) => r.count ?? 0;

  const tiles = [
    { label: "New enquiries", sub: "contact, partnership, investor", value: n(enq), href: "/admin/enquiries?status=new", urgent: true },
    { label: "Event registrations", sub: "last 7 days", value: n(regs), href: "/admin/registrations" },
    { label: "Award nominations", sub: "waiting for review", value: n(noms), href: "/admin/nominations", urgent: true },
    { label: "Reviews", sub: "waiting for approval", value: n(revs), href: "/admin/reviews", urgent: true },
    { label: "New sign-ups", sub: "last 7 days", value: n(users), href: "/admin/users" },
    { label: "Newsletter subscribers", sub: "new in the last 7 days", value: n(subs), href: "/admin/newsletter" },
    { label: "Job applications", sub: "last 7 days", value: n(apps), href: "/admin/jobs" },
  ];

  // Latest activity: the five newest of each kind, merged by date.
  const [aEnq, aReg, aNom, aSub, aUser] = await Promise.all([
    supabase.from("enquiries").select("id,name,kind,details,created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("event_registrations").select("id,name,created_at, event:event_id(title)").order("created_at", { ascending: false }).limit(5),
    supabase.from("award_nominations").select("id,nominee_name,created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("newsletter_subscribers").select("id,email,subscribed_at").order("subscribed_at", { ascending: false }).limit(5),
    supabase.from("profiles").select("id,full_name,email,created_at").order("created_at", { ascending: false }).limit(5),
  ]);
  type Item = { id: string; when: string; label: string; text: string; href: string };
  const items: Item[] = [
    ...(aEnq.data ?? []).map((r) => ({ id: "e" + r.id, when: r.created_at, label: "Enquiry", text: (r.details as { type?: string } | null)?.type === "account_deletion" ? `${r.name}: account deletion request` : `${r.name} (${String(r.kind).replace("_", " ")})`, href: "/admin/enquiries" })),
    ...((aReg.data ?? []) as unknown as { id: string; name: string; created_at: string; event: { title: string } | null }[]).map((r) => ({ id: "r" + r.id, when: r.created_at, label: "Registration", text: `${r.name}${r.event ? ` for ${r.event.title}` : ""}`, href: "/admin/registrations" })),
    ...(aNom.data ?? []).map((r) => ({ id: "n" + r.id, when: r.created_at, label: "Nomination", text: r.nominee_name, href: "/admin/nominations" })),
    ...(aSub.data ?? []).map((r) => ({ id: "s" + r.id, when: r.subscribed_at, label: "Subscriber", text: r.email, href: "/admin/newsletter" })),
    ...(aUser.data ?? []).map((r) => ({ id: "u" + r.id, when: r.created_at, label: "Sign-up", text: r.full_name || r.email || "New user", href: "/admin/users" })),
  ].sort((a, b) => +new Date(b.when) - +new Date(a.when)).slice(0, 10);

  return (
    <section aria-labelledby="inbox-h" className="mb-8">
      <h2 id="inbox-h" className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold text-forest"><Inbox className="size-5" aria-hidden />Inbox</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className={`block h-full rounded-2xl border p-4 transition hover:shadow-md ${t.urgent && t.value > 0 ? "border-gold bg-gold-soft" : "border-line bg-white"}`}>
              <p className="text-3xl font-semibold text-forest">{t.value}</p>
              <p className="mt-1 text-sm font-medium text-ink">{t.label}</p>
              <p className="text-xs text-muted">{t.sub}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-2xl border border-line bg-white p-5">
        <h3 className="mb-2 font-serif text-lg font-semibold text-forest">Latest activity</h3>
        {items.length === 0 ? <p className="text-sm text-muted">Nothing yet. New enquiries, registrations, nominations, sign-ups and subscribers appear here.</p> : (
          <ul className="divide-y divide-line text-sm">
            {items.map((i) => (
              <li key={i.id}><Link href={i.href} className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:text-forest">
                <span><span className="mr-2 inline-block min-w-24 rounded-full bg-forest-soft px-2.5 py-0.5 text-center text-xs font-medium text-forest">{i.label}</span>{i.text}</span>
                <span className="text-xs text-muted">{formatDate(i.when, true)}</span>
              </Link></li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
