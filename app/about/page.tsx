import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("about", "About Visit Lake Bosomtwe");

export default function Page() {
  return <CmsPage slug="about" fallbackTitle="About Visit Lake Bosomtwe" />;
}
