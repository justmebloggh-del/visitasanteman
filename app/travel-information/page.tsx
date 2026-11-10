import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("travel-information", "Travel Information");

export default function Page() {
  return <CmsPage slug="travel-information" fallbackTitle="Travel Information" />;
}
