import type { ImageKey } from "@/config/images";

/**
 * The banner collection. Text and links can be changed by an administrator in Admin, Banners (stored in
 * site_settings under "banners"); these are the defaults. Every link points to a page that exists.
 *
 * Banners 7, 8 and 14 describe programmes and an expo that are still in planning. Nothing is bookable yet, so their buttons
 * lead to existing pages, and the expo banner is switched off until the event is real.
 */
export type BannerKey =
  | "hero" | "explore" | "heritage" | "international" | "comeHome" | "events" | "youth" | "education"
  | "arts" | "tourism" | "business" | "media" | "awards" | "expo";

export interface BannerButton { label: string; href: string }
export interface BannerDef {
  key: BannerKey;
  /** Short name shown in Admin. */
  name: string;
  kicker?: string;
  headline: string;
  message: string;
  description?: string;
  buttons: BannerButton[];
  /** Photograph in the centre of the banner (built-in, config/images.ts). Left out where no picture truly fits. */
  image?: ImageKey;
  enabled: boolean;
}

export const bannerDefs: Record<BannerKey, BannerDef> = {
  hero: { key: "hero", name: "Homepage hero", kicker: "Asanteman, Ghana", headline: "Akwaaba to Asanteman",
    message: "A Kingdom of Heritage. A People of Pride. A Destination of Discovery.",
    description: "Discover the royal heritage, extraordinary destinations, rich culture, delicious cuisine and warm hospitality of the Ashanti Region.",
    buttons: [{ label: "Explore Ashanti", href: "/destinations" }, { label: "Plan Your Visit", href: "/travel-planner" }], image: "kenteDisplay", enabled: true },
  explore: { key: "explore", name: "Explore Ashanti", headline: "Discover the beauty of Ashanti",
    message: "From historic royal landmarks to breathtaking natural attractions, discover the extraordinary destinations of Asanteman.",
    buttons: [{ label: "Explore Destinations", href: "/destinations" }], image: "lake", enabled: true },
  heritage: { key: "heritage", name: "Heritage and culture", headline: "Rooted in history. Rich in culture.",
    message: "Discover the traditions, royal heritage, craftsmanship, festivals and cultural identity that make Asanteman unique.",
    buttons: [{ label: "Explore Our Heritage", href: "/culture" }], image: "regalia", enabled: true },
  international: { key: "international", name: "VisitAsanteman International", headline: "Your roots. Your heritage. Your Asanteman.",
    message: "Connecting Ghana, Africa and the global African diaspora through heritage, culture, travel and shared experiences.",
    buttons: [{ label: "Discover Your Heritage", href: "/international/heritage-travel" }], image: "chief", enabled: true },
  comeHome: { key: "comeHome", name: "Come Home to Ashanti", headline: "Come home to Ashanti",
    message: "Reconnect with your roots. Experience our culture. Discover the land of your heritage.",
    buttons: [{ label: "Begin Your Journey", href: "/travel-planner" }], image: "kenteDisplay", enabled: true },
  events: { key: "events", name: "Events and exhibitions", headline: "Where culture meets opportunity",
    message: "Experience international exhibitions, cultural festivals, business conferences, award ceremonies and unforgettable events.",
    buttons: [{ label: "Discover Our Events", href: "/events" }], image: "festival", enabled: true },
  youth: { key: "youth", name: "Youth empowerment", headline: "Empowering the next generation",
    message: "Creating opportunities for young people through education, innovation, leadership, skills development and entrepreneurship.",
    buttons: [{ label: "Explore Youth Programmes", href: "/education" }], enabled: true },
  education: { key: "education", name: "Education and inter-school programmes", headline: "Celebrating knowledge. Preserving our heritage.",
    message: "Bringing schools and young talents together through Asante history, educational competitions, arts and cultural programmes.",
    buttons: [{ label: "Discover Education Programmes", href: "/education" }], enabled: true },
  arts: { key: "arts", name: "Asante arts and culture", headline: "The art. The rhythm. The soul of Asanteman.",
    message: "Celebrating traditional music, dance, Kente, Adinkra, craftsmanship, fashion, storytelling and artistic excellence.",
    buttons: [{ label: "Experience Our Culture", href: "/culture/traditions" }], image: "kenteLoom", enabled: true },
  tourism: { key: "tourism", name: "Tourism and travel experiences", headline: "Experience Ashanti beyond expectations",
    message: "Explore breathtaking destinations, discover authentic experiences, enjoy local cuisine and experience the warmth of our people.",
    buttons: [{ label: "Explore Experiences", href: "/experiences" }], image: "waterfall", enabled: true },
  business: { key: "business", name: "Business and investment", headline: "Discover opportunities. Invest in Ashanti.",
    message: "Connecting businesses, entrepreneurs, investors and development partners to opportunities across the Ashanti Region.",
    buttons: [{ label: "Explore Business Opportunities", href: "/investment" }], image: "artisans", enabled: true },
  media: { key: "media", name: "VisitAsanteman Media", headline: "Stories that bring Asanteman to the world",
    message: "Explore our documentaries, destination stories, cultural features and inspiring discoveries.",
    buttons: [{ label: "Watch and Discover", href: "/articles" }], enabled: true },
  awards: { key: "awards", name: "Award shows and excellence", headline: "Recognising excellence. Celebrating greatness.",
    message: "Honouring outstanding achievements in business, education, tourism, culture, leadership and community development.",
    buttons: [{ label: "Discover Our Awards", href: "/awards" }], enabled: true },
  expo: { key: "expo", name: "Business and tourism expo", kicker: "In planning", headline: "Ashanti Business, Tourism & Investment Expo",
    message: "Bringing together businesses, investors, innovators, tourism leaders and international partners.",
    buttons: [{ label: "Become an Exhibitor", href: "/international/events-and-partnerships" }], enabled: false },
};

export const bannerKeys = Object.keys(bannerDefs) as BannerKey[];

type Overrides = Partial<Record<BannerKey, Partial<Pick<BannerDef, "headline" | "message" | "description" | "kicker" | "enabled" | "buttons">>>>;

/** Defaults merged with what an administrator saved. Links are only accepted if they stay on this site or use https. */
export function resolveBanner(key: BannerKey, saved?: unknown): BannerDef {
  const base = bannerDefs[key];
  const o = ((saved as Overrides | undefined)?.[key] ?? {}) as NonNullable<Overrides[BannerKey]>;
  const text = (v: unknown, fallback: string | undefined) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 500) : fallback);
  const buttons = Array.isArray(o.buttons)
    ? o.buttons.filter((b) => b && typeof b.label === "string" && b.label.trim() && typeof b.href === "string" && (b.href.startsWith("/") && !b.href.startsWith("//") || /^https:\/\//.test(b.href))).slice(0, 2).map((b) => ({ label: b.label.trim().slice(0, 60), href: b.href.trim() }))
    : base.buttons;
  return {
    ...base,
    headline: text(o.headline, base.headline)!, message: text(o.message, base.message)!,
    description: text(o.description, base.description), kicker: text(o.kicker, base.kicker),
    buttons: buttons.length ? buttons : base.buttons, enabled: typeof o.enabled === "boolean" ? o.enabled : base.enabled,
  };
}
