import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { cookiePolicy } from "@/config/legal";

export const revalidate = 60;
export async function generateMetadata() {
  const m = await cmsMetadata("cookie-policy", "Cookie Policy");
  // This page always has its own text, so it can be indexed even before an editor writes a body.
  return { ...m, description: m.description ?? "The cookies VisitAsanteman uses, what each is for, and how to change your choices.", robots: undefined };
}

export default function Page() {
  return <CmsPage slug="cookie-policy" fallbackTitle="Cookie Policy" fallback={<LegalDocument doc={cookiePolicy} />} />;
}
