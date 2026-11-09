import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("travel-guide", "Travel Guide");

export default function Page() {
  return <CmsPage slug="travel-guide" fallbackTitle="Travel Guide" />;
}
