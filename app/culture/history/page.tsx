import Link from "next/link";
import { AsanteRise } from "@/components/culture/AsanteRise";
import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("culture-history", "History", "/culture/history");

export default function Page() {
  return (
    <CmsPage slug="culture-history" fallbackTitle="History" banner="explore" crumbs={[{ label: "Culture & Heritage", href: "/culture" }]}>
      <AsanteRise />
      <p className="mt-12 text-sm text-muted"><Link href="/culture" className="text-lake-dark underline">Back to Culture & Heritage</Link></p>
    </CmsPage>
  );
}
