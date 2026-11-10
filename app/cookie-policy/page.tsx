import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("cookie-policy", "Cookie Policy");

export default function Page() {
  return <CmsPage slug="cookie-policy" fallbackTitle="Cookie Policy" />;
}
