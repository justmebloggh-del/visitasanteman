import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("terms", "Terms and Conditions");

export default function Page() {
  return <CmsPage slug="terms" fallbackTitle="Terms and Conditions" />;
}
