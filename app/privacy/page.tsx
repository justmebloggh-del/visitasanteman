import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("privacy", "Privacy Policy");

export default function Page() {
  return <CmsPage slug="privacy" fallbackTitle="Privacy Policy" />;
}
