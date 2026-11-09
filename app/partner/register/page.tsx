import type { Metadata } from "next";
import Link from "next/link";
import { BusinessRegisterForm } from "@/components/partner/PartnerForms";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Register your business", robots: { index: false } };

export default function RegisterBusiness() {
  return (
    <Container className="max-w-lg py-12">
      <h1 className="mb-2 text-3xl font-semibold text-forest">Register your business</h1>
      <p className="mb-6 text-sm text-muted">We will email you a link to verify your address. Then you can add your listing.</p>
      <BusinessRegisterForm />
      <p className="mt-5 text-sm text-muted">Already registered? <Link href="/login?next=/partner/activate" className="text-lake-dark hover:underline">Log in</Link></p>
    </Container>
  );
}
