import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("about", "About VisitAsanteman");

export default function Page() {
  return <CmsPage slug="about" fallbackTitle="About VisitAsanteman" />;
}
