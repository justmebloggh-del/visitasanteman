import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("getting-around", "Getting Around Ashanti");

export default function Page() {
  return <CmsPage slug="getting-around" fallbackTitle="Getting Around Ashanti" />;
}
