import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { termsAndConditions } from "@/config/legal";

export const revalidate = 60;
export async function generateMetadata() {
  const m = await cmsMetadata("terms", "Terms and Conditions");
  // This page always has its own text, so it can be indexed even before an editor writes a body.
  return { ...m, description: m.description ?? "The terms for using the VisitAsanteman website.", robots: undefined };
}

export default function Page() {
  return <CmsPage slug="terms" fallbackTitle="Terms and Conditions" fallback={<LegalDocument doc={termsAndConditions} />} />;
}
