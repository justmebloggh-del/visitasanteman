import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("international-heritage-travel", "Heritage and ancestral travel", "/international/heritage-travel");

export default function Page() {
  return <CmsPage slug="international-heritage-travel" fallbackTitle="Heritage and ancestral travel" crumbs={[{ label: "VisitAsanteman International", href: "/international" }]} />;
}
