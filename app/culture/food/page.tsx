import Link from "next/link";
import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("culture-food", "Food", "/culture/food");

export default function Page() {
  return (
    <CmsPage slug="culture-food" fallbackTitle="Food" crumbs={[{ label: "Culture & Heritage", href: "/culture" }]}>
      <p className="mt-8 text-sm text-muted"><Link href="/culture" className="text-lake-dark underline">Back to Culture & Heritage</Link></p>
    </CmsPage>
  );
}
