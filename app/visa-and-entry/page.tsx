import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("visa-and-entry", "Visa and Entry");

export default function Page() {
  return <CmsPage slug="visa-and-entry" fallbackTitle="Visa and Entry" />;
}
