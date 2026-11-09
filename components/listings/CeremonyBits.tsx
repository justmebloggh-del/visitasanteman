import { AlertTriangle, Info } from "lucide-react";
import { attendanceLabels } from "@/config/site";

export function AttendanceNotice({ attendance, notes }: { attendance: string; notes?: string | null }) {
  const open = attendance === "public";
  return (
    <section aria-label="Public attendance" className={`rounded-xl border p-4 text-sm ${open ? "border-line bg-mist" : "border-gold bg-gold-soft"}`}>
      <p className="flex items-start gap-2 font-medium text-ink">
        {open ? <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />}
        {attendanceLabels[attendance] ?? attendanceLabels.unknown}
      </p>
      {notes && <p className="mt-2 whitespace-pre-line text-ink/90">{notes}</p>}
    </section>
  );
}

const GH = { timeZone: "UTC" } as const;   // Ghana is UTC+0 all year
export function ceremonyWhen(c: { starts_at: string | null; ends_at: string | null; date_confirmed: boolean }) {
  if (!c.date_confirmed || !c.starts_at) return null;
  const d = new Intl.DateTimeFormat("en-GB", { ...GH, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(c.starts_at));
  const t = new Intl.DateTimeFormat("en-GB", { ...GH, hour: "2-digit", minute: "2-digit" }).format(new Date(c.starts_at));
  return { date: d, time: t === "00:00" ? null : t };
}
