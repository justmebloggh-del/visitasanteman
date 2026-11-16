import { Banner } from "@/components/banners/Banner";
import type { BannerKey } from "@/config/banners";
import { getBanner } from "@/lib/content/banners";

/** One banner by key, with the administrator's edits. Renders nothing when it is switched off in Admin, Banners. */
export async function SectionBanner({ k, as, className, children, crumbs }: { k: BannerKey; as?: "h1" | "h2"; className?: string; children?: React.ReactNode; crumbs?: { label: string; href?: string }[] }) {
  const def = await getBanner(k);
  return def ? <Banner def={def} as={as} className={className} crumbs={crumbs}>{children}</Banner> : null;
}

// One named component per banner. They share the design in Banner.tsx; each is used on exactly one page (config/banners.ts, bannerPlacement).
export const ExploreBanner = () => <SectionBanner k="explore" />;
export const HeritageBanner = ({ crumbs, as }: { crumbs?: { label: string; href?: string }[]; as?: "h1" | "h2" } = {}) => <SectionBanner k="heritage" crumbs={crumbs} as={as} />;
export const InternationalBanner = () => <SectionBanner k="international" />;
export const ComeHomeBanner = () => <SectionBanner k="comeHome" />;
export const EventsBanner = ({ crumbs, as }: { crumbs?: { label: string; href?: string }[]; as?: "h1" | "h2" } = {}) => <SectionBanner k="events" crumbs={crumbs} as={as} />;
export const AwardsBanner = ({ crumbs, as }: { crumbs?: { label: string; href?: string }[]; as?: "h1" | "h2" } = {}) => <SectionBanner k="awards" crumbs={crumbs} as={as} />;
export const YouthBanner = () => <SectionBanner k="youth" />;
export const EducationBanner = () => <SectionBanner k="education" />;
export const ArtsBanner = () => <SectionBanner k="arts" />;
export const TourismBanner = () => <SectionBanner k="tourism" />;
export const BusinessBanner = () => <SectionBanner k="business" />;
export const MediaBanner = ({ crumbs, as }: { crumbs?: { label: string; href?: string }[]; as?: "h1" | "h2" } = {}) => <SectionBanner k="media" crumbs={crumbs} as={as} />;
export const ExpoBanner = () => <SectionBanner k="expo" />;
