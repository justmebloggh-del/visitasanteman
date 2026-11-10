import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("why-ashanti", "Why Ashanti");

export default function Page() {
  return <CmsPage slug="why-ashanti" fallbackTitle="Why Ashanti" />;
}
