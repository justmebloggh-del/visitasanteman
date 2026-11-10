import Link from "next/link";
import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("culture", "Culture & Heritage");

const topics = [
  { href: "/culture/ceremonies", title: "Ceremonies & festivals", text: "Which ceremonies visitors may attend, with etiquette and confirmed dates." },
  { href: "/culture/calendar", title: "Cultural calendar", text: "Dates confirmed by the organisers, by month." },
  { href: "/culture/history", title: "History", text: "How Asanteman came to be, told from verified sources." },
  { href: "/culture/traditions", title: "Traditions", text: "Customs and institutions, reviewed by their custodians before publication." },
  { href: "/culture/festivals", title: "Festivals", text: "Celebrations across the region. See also the events calendar." },
  { href: "/culture/crafts", title: "Crafts", text: "The makers and workshops behind the region's crafts." },
  { href: "/culture/food", title: "Food", text: "Local dishes and where to taste them." },
];

export default function Page() {
  return (
    <CmsPage slug="culture" fallbackTitle="Culture & Heritage">
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => (
          <li key={t.href}><Link href={t.href} className="block h-full rounded-2xl border border-line bg-white p-5 transition hover:shadow-md">
            <h2 className="font-serif text-xl font-semibold text-forest">{t.title}</h2><p className="mt-1 text-sm text-muted">{t.text}</p>
          </Link></li>
        ))}
      </ul>
      <p className="mt-8 max-w-2xl text-sm text-muted">Cultural and traditional content is published only after it has been checked with the appropriate custodians and sources.</p>
    </CmsPage>
  );
}
