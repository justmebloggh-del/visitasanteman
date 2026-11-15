import { Banner } from "@/components/banners/Banner";
import { HeroMedia } from "@/components/banners/HeroMedia";
import type { BannerKey } from "@/config/banners";
import { BannerRotator } from "@/components/banners/BannerRotator";
import { getBanner, getBanners } from "@/lib/content/banners";

/** Shared loader: one banner by key, with the administrator's edits. Renders nothing when switched off. */
async function Keyed({ k, as, priority, className, children }: { k: BannerKey; as?: "h1" | "h2"; priority?: boolean; className?: string; children?: React.ReactNode }) {
  const def = await getBanner(k);
  return def ? <Banner def={def} as={as} priority={priority ?? true} className={className}>{children}</Banner> : null;
}

// Named banners, one per section of the site. They share one design (Banner.tsx); only the words, links and photograph differ.
export const PromotionalBanner = Keyed;
export const HeritageBanner = (p: { className?: string }) => <Keyed k="heritage" {...p} />;
export const ExploreBanner = (p: { className?: string }) => <Keyed k="explore" {...p} />;
export const InternationalBanner = (p: { className?: string }) => <Keyed k="international" {...p} />;
export const ComeHomeBanner = (p: { className?: string }) => <Keyed k="comeHome" {...p} />;
export const EventsBanner = (p: { className?: string }) => <Keyed k="events" {...p} />;
export const AwardsBanner = (p: { className?: string }) => <Keyed k="awards" {...p} />;
export const YouthBanner = (p: { className?: string }) => <Keyed k="youth" {...p} />;
export const EducationBanner = (p: { className?: string }) => <Keyed k="education" {...p} />;
export const ArtsBanner = (p: { className?: string }) => <Keyed k="arts" {...p} />;
export const TourismBanner = (p: { className?: string }) => <Keyed k="tourism" {...p} />;
export const BusinessBanner = (p: { className?: string }) => <Keyed k="business" {...p} />;
export const MediaBanner = (p: { className?: string }) => <Keyed k="media" {...p} />;
export const ExpoBanner = (p: { className?: string }) => <Keyed k="expo" {...p} />;

export async function MainHeroBanner({ children, imageSrc, imageAlt }: { children?: React.ReactNode; imageSrc?: string | null; imageAlt?: string }) {
  const def = await getBanner("hero");
  if (!def) return null;
  return <Banner def={def} as="h1" priority media={<HeroMedia fallbackKey={def.image ?? "kenteDisplay"} imageSrc={imageSrc} imageAlt={imageAlt} />}>{children}</Banner>;
}

/** The homepage rotator: a few of the section banners, one at a time. */
export async function HomeBannerRotator() {
  const defs = await getBanners(["explore", "heritage", "events", "tourism", "business", "awards"]);
  if (defs.length === 0) return null;
  return (
    <div className="mt-16">
      <BannerRotator label="Featured on VisitAsanteman">
        {defs.map((d) => <Banner key={d.key} def={d} />)}
      </BannerRotator>
    </div>
  );
}
