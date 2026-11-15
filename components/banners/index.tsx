import { Banner } from "@/components/banners/Banner";
import type { BannerKey } from "@/config/banners";
import { getBanner } from "@/lib/content/banners";

/** One banner by key, with the administrator's edits. Renders nothing when it is switched off in Admin, Banners. */
export async function SectionBanner({ k, as, className, children }: { k: BannerKey; as?: "h1" | "h2"; className?: string; children?: React.ReactNode }) {
  const def = await getBanner(k);
  return def ? <Banner def={def} as={as} className={className}>{children}</Banner> : null;
}

// One named component per banner. They share the design in Banner.tsx; each is used on exactly one page (config/banners.ts, bannerPlacement).
export const MainHeroBanner = ({ children }: { children?: React.ReactNode }) => <SectionBanner k="hero" as="h1">{children}</SectionBanner>;
export const ExploreBanner = () => <SectionBanner k="explore" />;
export const HeritageBanner = () => <SectionBanner k="heritage" />;
export const InternationalBanner = () => <SectionBanner k="international" />;
export const ComeHomeBanner = () => <SectionBanner k="comeHome" />;
export const EventsBanner = () => <SectionBanner k="events" />;
export const AwardsBanner = () => <SectionBanner k="awards" />;
export const YouthBanner = () => <SectionBanner k="youth" />;
export const EducationBanner = () => <SectionBanner k="education" />;
export const ArtsBanner = () => <SectionBanner k="arts" />;
export const TourismBanner = () => <SectionBanner k="tourism" />;
export const BusinessBanner = () => <SectionBanner k="business" />;
export const MediaBanner = () => <SectionBanner k="media" />;
export const ExpoBanner = () => <SectionBanner k="expo" />;
