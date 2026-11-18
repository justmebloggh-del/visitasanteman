import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { CookieSettingsButton } from "@/components/consent/ConsentManager";
import { HashtagTicker } from "@/components/layout/HashtagTicker";
import { Wordmark } from "@/components/brand/Wordmark";
import { Container } from "@/components/ui";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { siteConfig, socialDefaults, socialLabels } from "@/config/site";
import { getSettings } from "@/lib/content/public";
import { safeUrl, whatsappLink } from "@/lib/utils";

const explore = [
  { href: "/attractions", label: "Attractions" },
  { href: "/districts", label: "Districts" },
  { href: "/destinations", label: "Destinations" },
  { href: "/culture", label: "Culture & heritage" },
  { href: "/communities", label: "Communities" },
  { href: "/experiences", label: "Experiences" },
  { href: "/events", label: "Events" },
  { href: "/map", label: "Tourism map" },
  { href: "/gallery", label: "Gallery" },
];
const plan = [
  { href: "/accommodation", label: "Accommodation" },
  { href: "/restaurants", label: "Food and dining" },
  { href: "/venues", label: "Event venues" },
  { href: "/education", label: "Education" },
  { href: "/sports", label: "Sports" },
  { href: "/transport", label: "Getting around" },
  { href: "/markets", label: "Markets and shopping" },
  { href: "/business-directory", label: "Business directory" },
  { href: "/travel-guide", label: "Travel guide" },
  { href: "/travel-planner", label: "Travel planner" },
  { href: "/travel-planner/itineraries", label: "Curated itineraries" },
  { href: "/investment", label: "Invest in Asanteman tourism" },
  { href: "/articles", label: "Stories and news" },
  { href: "/booking", label: "Check your booking" },
];

export async function Footer() {
  const settings = await getSettings();
  const contact = settings.contact ?? {};
  const social = settings.social ?? {};
  const merged: Record<string, string> = { ...socialDefaults };
  for (const [k, v] of Object.entries(social)) if (typeof v === "string" && v.trim()) merged[k] = v.trim();
  const socials = Object.entries(merged).filter(([, v]) => safeUrl(String(v)));

  return (
    <footer className="mt-24 bg-forest-dark text-white/85">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark size="lg" />
          <p className="mt-4 text-sm leading-relaxed">{siteConfig.description}</p>
          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3 text-sm">
              {socials.map(([name, url]) => (
                <li key={name}><a href={safeUrl(String(url))!} rel="noopener noreferrer" target="_blank" className="inline-flex min-h-11 items-center sm:min-h-0 underline-offset-4 hover:underline" aria-label={`${socialLabels[name] ?? name} (opens in a new tab)`}>{socialLabels[name] ?? name}</a></li>
              ))}
            </ul>
          )}
        </div>

        <FooterList title="Explore" links={explore} />
        <FooterList title="Plan your trip" links={plan} />

        <div>
          <h2 className="font-serif text-lg font-semibold text-white">Get in touch</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {contact.email && <li className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0" aria-hidden /><a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a></li>}
            {contact.phone && <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0" aria-hidden />{contact.phone}</li>}
            {contact.address && <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />{contact.address}</li>}
            {whatsappLink(String(contact.whatsapp ?? ""), "Hello VisitAsanteman, I would like help planning a visit.") && <li><a href={whatsappLink(String(contact.whatsapp), "Hello VisitAsanteman, I would like help planning a visit.")!} target="_blank" rel="noopener noreferrer" className="hover:underline">Chat on WhatsApp</a></li>}
            <li><Link href="/contact" className="inline-flex min-h-11 items-center sm:min-h-0 hover:underline">Contact form</Link></li>
            <li><Link href="/partner" className="inline-flex min-h-11 items-center sm:min-h-0 hover:underline">List your business</Link></li>
            <li><Link href="/advertise" className="inline-flex min-h-11 items-center sm:min-h-0 hover:underline">Advertise with us</Link></li>
            <li><Link href="/partner-with-us" className="inline-flex min-h-11 items-center sm:min-h-0 hover:underline">Partner with us</Link></li>
            <li><Link href="/contact?kind=partnership" className="inline-flex min-h-11 items-center sm:min-h-0 hover:underline">Partnership enquiries</Link></li>
          </ul>
          <div className="mt-5"><NewsletterForm compact /></div>
        </div>
      </Container>
      {(settings.general?.hashtag ?? "#VisitAsanteman") && (
        <Container><HashtagTicker text={String(settings.general?.hashtag ?? "#VisitAsanteman")} /></Container>
      )}
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-white/60 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. {siteConfig.tagline}</p>
          <p className="flex flex-wrap gap-x-4"><CookieSettingsButton className="inline-flex min-h-11 items-center hover:text-white sm:min-h-0" /><Link href="/cookie-policy" className="inline-flex min-h-11 items-center hover:text-white sm:min-h-0">Cookie policy</Link><Link href="/about/our-mission" className="inline-flex min-h-11 items-center hover:text-white sm:min-h-0">Our mission</Link><Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-white sm:min-h-0">Privacy policy</Link><Link href="/terms" className="inline-flex min-h-11 items-center hover:text-white sm:min-h-0">Terms and conditions</Link></p>
        </Container>
      </div>
    </footer>
  );
}

function FooterList({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="font-serif text-lg font-semibold text-white">{title}</h2>
      <ul className="mt-2 space-y-0 text-sm sm:mt-3 sm:space-y-2">
        {links.map((l) => <li key={l.href}><Link href={l.href} className="inline-flex min-h-11 items-center hover:text-white hover:underline sm:min-h-0">{l.label}</Link></li>)}
      </ul>
    </div>
  );
}
