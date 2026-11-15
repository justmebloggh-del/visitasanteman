import { ExpoBanner } from "@/components/banners";
import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("international-partnerships", "International events and partnerships", "/international/events-and-partnerships");

export default function Page() {
  return <CmsPage slug="international-partnerships" fallbackTitle="International events and partnerships" banner={<ExpoBanner />} crumbs={[{ label: "VisitAsanteman International", href: "/international" }]} />;
}
