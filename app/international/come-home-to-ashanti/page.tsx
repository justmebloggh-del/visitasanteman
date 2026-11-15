import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("international-come-home", "Come Home to Ashanti", "/international/come-home-to-ashanti");

export default function Page() {
  return <CmsPage slug="international-come-home" fallbackTitle="Come Home to Ashanti" crumbs={[{ label: "VisitAsanteman International", href: "/international" }]} />;
}
