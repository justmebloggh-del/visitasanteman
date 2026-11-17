/**
 * The banner collection. Text and links can be changed by an administrator in Admin, Banners (stored in
 * site_settings under "banners"); these are the defaults. Every link points to a page that exists.
 *
 * Banners are not photographs: green kente, heritage gold and the emblem at the far right. Each banner appears on exactly one page (see
 * config/banner-placement.ts) and never links to the page it sits on.
 *
 * Banners 7, 8 and 14 describe programmes and an expo that are still in planning. Nothing is bookable yet, so their buttons
 * lead to existing pages, and the expo banner is switched off until the event is real.
 */
export type BannerKey =
  | "explore" | "heritage" | "international" | "comeHome" | "events" | "youth" | "education"
  | "arts" | "tourism" | "business" | "media" | "awards" | "expo" | "manhyia";

export interface BannerStyle {
  /** Which kente-inspired weave fills the background (see globals.css). */
  pattern: "a" | "b" | "c";
  /** standard: words in one block. ledger: headline, then message and buttons in a second column. stacked: big headline over a row of message and buttons. */
  layout: "standard" | "ledger" | "stacked";
  motion: "rise" | "slide" | "fade";
}
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
  /** How this banner looks. Every banner shares the green and gold identity and the emblem at the far right; these vary the weave, the composition and the entrance. */
  style: BannerStyle;
  enabled: boolean;
}

export const bannerDefs: Record<BannerKey, BannerDef> = {
  explore: { key: "explore", style: { pattern: "a", layout: "standard", motion: "rise" }, name: "Explore Ashanti", headline: "Discover the beauty of Ashanti",
    message: "From historic royal landmarks to breathtaking natural attractions, discover the extraordinary destinations of Asanteman.",
    buttons: [{ label: "Explore Destinations", href: "/destinations" }], enabled: true },
  heritage: { key: "heritage", style: { pattern: "b", layout: "ledger", motion: "slide" }, name: "Heritage and culture", headline: "Rooted in history. Rich in culture.",
    message: "Discover the traditions, royal heritage, craftsmanship, festivals and cultural identity that make Asanteman unique.",
    buttons: [{ label: "Explore Our Heritage", href: "/culture/history" }], enabled: true },
  international: { key: "international", style: { pattern: "c", layout: "standard", motion: "fade" }, name: "VisitAsanteman International", headline: "Your roots. Your heritage. Your Asanteman.",
    message: "Connecting Ghana, Africa and the global African diaspora through heritage, culture, travel and shared experiences.",
    buttons: [{ label: "Discover Your Heritage", href: "/international/heritage-travel" }], enabled: true },
  comeHome: { key: "comeHome", style: { pattern: "a", layout: "stacked", motion: "slide" }, name: "Come Home to Ashanti", headline: "Come home to Ashanti",
    message: "Reconnect with your roots. Experience our culture. Discover the land of your heritage.",
    buttons: [{ label: "Begin Your Journey", href: "/travel-planner" }], enabled: true },
  events: { key: "events", style: { pattern: "c", layout: "ledger", motion: "rise" }, name: "Events and exhibitions", headline: "Where culture meets opportunity",
    message: "Experience international exhibitions, cultural festivals, business conferences, award ceremonies and unforgettable events.",
    buttons: [{ label: "Discover Our Events", href: "/events" }], enabled: true },
  youth: { key: "youth", style: { pattern: "b", layout: "standard", motion: "fade" }, name: "Youth empowerment", headline: "Empowering the next generation",
    message: "Creating opportunities for young people through education, innovation, leadership, skills development and entrepreneurship.",
    buttons: [{ label: "Explore Youth Programmes", href: "/education" }], enabled: true },
  education: { key: "education", style: { pattern: "a", layout: "ledger", motion: "slide" }, name: "Education and inter-school programmes", headline: "Celebrating knowledge. Preserving our heritage.",
    message: "Bringing schools and young talents together through Asante history, educational competitions, arts and cultural programmes.",
    buttons: [{ label: "Discover Education Programmes", href: "/education/events" }], enabled: true },
  arts: { key: "arts", style: { pattern: "b", layout: "stacked", motion: "rise" }, name: "Asante arts and culture", headline: "The art. The rhythm. The soul of Asanteman.",
    message: "Celebrating traditional music, dance, Kente, Adinkra, craftsmanship, fashion, storytelling and artistic excellence.",
    buttons: [{ label: "Experience Our Culture", href: "/culture/ceremonies" }], enabled: true },
  tourism: { key: "tourism", style: { pattern: "c", layout: "standard", motion: "slide" }, name: "Tourism and travel experiences", headline: "Experience Ashanti beyond expectations",
    message: "Explore breathtaking destinations, discover authentic experiences, enjoy local cuisine and experience the warmth of our people.",
    buttons: [{ label: "Explore Experiences", href: "/experiences" }], enabled: true },
  business: { key: "business", style: { pattern: "b", layout: "ledger", motion: "fade" }, name: "Business and investment", headline: "Discover opportunities. Invest in Ashanti.",
    message: "Connecting businesses, entrepreneurs, investors and development partners to opportunities across the Ashanti Region.",
    buttons: [{ label: "Explore Business Opportunities", href: "/investment" }], enabled: true },
  media: { key: "media", style: { pattern: "a", layout: "standard", motion: "slide" }, name: "VisitAsanteman Media", headline: "Stories that bring Asanteman to the world",
    message: "Explore our documentaries, destination stories, cultural features and inspiring discoveries.",
    buttons: [{ label: "Watch and Discover", href: "/articles" }], enabled: true },
  awards: { key: "awards", style: { pattern: "c", layout: "stacked", motion: "fade" }, name: "Award shows and excellence", headline: "Recognising excellence. Celebrating greatness.",
    message: "Honouring outstanding achievements in business, education, tourism, culture, leadership and community development.",
    buttons: [{ label: "Discover Our Awards", href: "/awards" }], enabled: true },
  manhyia: { key: "manhyia", style: { pattern: "b", layout: "standard", motion: "fade" }, name: "Manhyia Palace", headline: "Manhyia Palace",
    message: "The seat of the Asantehene in Kumasi, and home to the Manhyia Palace Museum.",
    buttons: [{ label: "Plan Your Visit", href: "/travel-planner" }], enabled: true },
  expo: { key: "expo", style: { pattern: "b", layout: "standard", motion: "rise" }, name: "Business and tourism expo", kicker: "In planning", headline: "Ashanti Business, Tourism & Investment Expo",
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

/** The one page each banner appears on. Kept here so a banner can never be shown twice by accident. */
export const bannerPlacement: Record<BannerKey, string> = {
  explore: "/districts", heritage: "/culture", international: "/international", comeHome: "/international/come-home-to-ashanti",
  events: "/culture/calendar", awards: "/events", arts: "/culture/traditions", tourism: "/accommodation", business: "/business-directory",
  media: "/gallery", youth: "/jobs", education: "/education", expo: "/international/events-and-partnerships", manhyia: "/manhyia",
};
