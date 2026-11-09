import Link from "next/link";
import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("about-partners", "Our partners", "/about/partners");

export default function Page() {
  return (
    <CmsPage slug="about-partners" fallbackTitle="Our partners" crumbs={[{ label: "About us", href: "/about" }]}>
      <p className="mt-8 text-sm text-muted">Would your organisation like to work with us? See <Link href="/partner-with-us" className="text-lake-dark underline">Partner with us</Link>.</p>
    </CmsPage>
  );
}
