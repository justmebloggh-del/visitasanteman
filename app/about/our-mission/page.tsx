import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("about-our-mission", "Our mission", "/about/our-mission");

export default function Page() {
  return <CmsPage slug="about-our-mission" fallbackTitle="Our mission" crumbs={[{ label: "About us", href: "/about" }]} />;
}
