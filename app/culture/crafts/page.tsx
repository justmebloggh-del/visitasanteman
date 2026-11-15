import Link from "next/link";
import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("culture-crafts", "Crafts", "/culture/crafts");

export default function Page() {
  return (
    <CmsPage slug="culture-crafts" fallbackTitle="Crafts" crumbs={[{ label: "Culture & Heritage", href: "/culture" }]}>
      <p className="mt-8 text-sm text-muted"><Link href="/culture" className="text-lake-dark underline">Back to Culture & Heritage</Link></p>
    </CmsPage>
  );
}
