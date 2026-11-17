import Link from "next/link";
import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";
import { WelcomeSlideshow } from "@/components/home/WelcomeSlideshow";
import { manhyiaSlides } from "@/config/manhyia";
import { getAttraction } from "@/lib/content/public";

export const revalidate = 60;
export async function generateMetadata() {
  const m = await cmsMetadata("manhyia", "Manhyia Palace", "/manhyia");
  // This page always has its own introduction, so it can be indexed even before an editor writes a body.
  return { ...m, description: m.description ?? "Manhyia Palace in Kumasi, the seat of the Asantehene, and the Manhyia Palace Museum: what is there, how to plan a visit and the ceremonies connected to it.", robots: undefined };
}

// Everything on this page comes from the sources already recorded in the site (the Ghana Tourism Authority listing, the
// touringghana.com notes and the owner's welcome address). Opening times, fees and rules have not been verified, so none are given.
const related = [
  { href: "/culture/ceremonies", title: "Ceremonies & festivals", text: "Akwasidae and the other ceremonies of the Asante calendar." },
  { href: "/culture/calendar", title: "Cultural calendar", text: "Dates the organisers have confirmed." },
  { href: "/culture/history", title: "History", text: "How Asanteman came to be." },
  { href: "/events", title: "Events", text: "What is happening across Asanteman." },
  { href: "/accommodation", title: "Where to stay", text: "Places to stay in and around Kumasi." },
  { href: "/getting-around", title: "Getting around", text: "Reaching Kumasi and moving about." },
];

export default async function ManhyiaPage() {
  const museum = await getAttraction("manhyia-palace-museum");
  return (
    <CmsPage
      slug="manhyia" fallbackTitle="Manhyia Palace" banner="manhyia" crumbs={[{ label: "Culture & Heritage", href: "/culture" }]}
      fallback={
        <div className="max-w-3xl space-y-5 text-lg leading-relaxed text-ink">
          <p>Manhyia Palace in Kumasi is the seat of the Asantehene, the king of the Asante. It is a working royal court and the centre of Asante tradition, and part of it is open to visitors as the Manhyia Palace Museum.</p>
          <p className="border-l-4 border-gold pl-4 text-base text-muted">
            “Within the historic walls of Manhyia Palace resides the Asantehene, His Majesty Otumfuo Osei Tutu II, the 16th occupant of the Golden Stool.” <span className="not-italic">From the VisitAsanteman welcome address.</span>
          </p>
        </div>
      }
    >
      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="space-y-10">
          <section aria-labelledby="museum">
            <h2 id="museum" className="font-serif text-2xl font-semibold text-forest">Manhyia Palace Museum</h2>
            <p className="mt-3 text-muted">The museum tells the story of the Asante court through royal history, artefacts, regalia and photographs of past kings. The courtyard and museum also hold statues of past Asante kings and queens.</p>
            {museum && <p className="mt-3"><Link href={`/attractions/${museum.slug}`} className="font-medium text-lake-dark underline">Read more about the museum</Link></p>}
          </section>
          <section aria-labelledby="sixth-sunday">
            <h2 id="sixth-sunday" className="font-serif text-2xl font-semibold text-forest">The king in session</h2>
            <p className="mt-3 text-muted">The Ghana Tourism Authority notes that at Manhyia Palace the Asante king sits in session every sixth Sunday, with processions, drumming and music. That source gives no dates, so confirm them locally before you plan a trip around one.</p>
          </section>
          <section aria-labelledby="mausoleums">
            <h2 id="mausoleums" className="font-serif text-2xl font-semibold text-forest">Royal mausoleums</h2>
            <p className="mt-3 text-muted">The Asante royal mausoleums are at Bantama and Breman. Visits need the consent of Manhyia Palace.</p>
          </section>
          <section aria-labelledby="plan" className="rounded-2xl border border-line bg-mist p-6">
            <h2 id="plan" className="font-serif text-2xl font-semibold text-forest">Before you visit</h2>
            <p className="mt-3 text-muted">Opening times, entry fees, photography rules and dress guidance have not yet been verified for this website, so we do not list them. Please confirm them directly with Manhyia Palace and the museum before you travel, and follow the guidance of palace staff on the day.</p>
            <p className="mt-3 text-sm text-muted">Cultural content on VisitAsanteman is published with respect for the traditional institutions that own it, and is checked with the appropriate custodians before it is marked as verified.</p>
          </section>
        </div>
        <WelcomeSlideshow slides={manhyiaSlides} className="mx-auto w-full max-w-[24rem] lg:sticky lg:top-36" />
      </div>
      <section className="mt-16" aria-labelledby="more">
        <h2 id="more" className="font-serif text-2xl font-semibold text-forest">Continue exploring</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((r) => (
            <li key={r.href}><Link href={r.href} className="block h-full rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="text-lg font-semibold text-forest">{r.title}</span><span className="mt-1 block text-sm text-muted">{r.text}</span>
            </Link></li>
          ))}
        </ul>
      </section>
    </CmsPage>
  );
}
