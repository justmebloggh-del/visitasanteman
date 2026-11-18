import type { LegalDoc } from "@/config/legal";

/** Renders one of the plain-language legal pages in config/legal.ts. */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <div className="max-w-3xl">
      <p className="text-lg leading-relaxed text-ink">{doc.intro}</p>
      <p className="mt-3 text-sm text-muted">Last updated: {doc.updated}. This is a draft that is awaiting legal review.</p>
      <nav aria-label="On this page" className="mt-6 rounded-xl bg-mist p-4">
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {doc.sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="inline-flex min-h-11 items-center text-lake-dark underline-offset-2 hover:underline sm:min-h-0">{s.title}</a></li>)}
        </ul>
      </nav>
      <div className="mt-10 space-y-9">
        {doc.sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-40">
            <h2 id={`${s.id}-h`} className="font-serif text-2xl font-semibold text-forest">{s.title}</h2>
            {s.paragraphs?.map((p, i) => <p key={i} className="mt-3 leading-relaxed text-ink">{p}</p>)}
            {s.items && <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-ink marker:text-gold">{s.items.map((it, i) => <li key={i}>{it}</li>)}</ul>}
          </section>
        ))}
      </div>
    </div>
  );
}
