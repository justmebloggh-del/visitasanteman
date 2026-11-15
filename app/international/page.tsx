import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("international", "VisitAsanteman International", "/international");

export default function Page() {
  return <CmsPage slug="international" fallbackTitle="VisitAsanteman International" />;
}
