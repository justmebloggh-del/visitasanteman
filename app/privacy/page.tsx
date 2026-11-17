import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { privacyPolicy } from "@/config/legal";

export const revalidate = 60;
export async function generateMetadata() {
  const m = await cmsMetadata("privacy", "Privacy Policy");
  // This page always has its own text, so it can be indexed even before an editor writes a body.
  return { ...m, description: m.description ?? "How VisitAsanteman collects, uses and protects personal information, and the choices you have.", robots: undefined };
}

export default function Page() {
  return <CmsPage slug="privacy" fallbackTitle="Privacy Policy" fallback={<LegalDocument doc={privacyPolicy} />} />;
}
