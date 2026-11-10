import type { Metadata } from "next";
import Link from "next/link";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";

export const metadata: Metadata = buildMetadata({
  title: "Partner with us",
  description: "Tourism authorities, assemblies, community groups, cultural institutions and organisations are welcome to work with VisitAsanteman.",
  path: "/partner-with-us",
});

export default function PartnerWithUsPage() {
  return (
    <>
      <PageHeader title="Partner with us" intro="Working together makes Asanteman easier to discover." crumbs={[{ label: "Partner with us" }]} />
      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        <div className="space-y-4 text-ink/90">
          <p>We welcome organisations that can help us present the region accurately: district assemblies, traditional and cultural institutions, community groups, tourism bodies, universities and responsible businesses.</p>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>Running a tourism business? <Link href="/partner" className="text-lake-dark underline">List your business</Link>.</li>
            <li>Interested in funding or developing tourism projects? See <Link href="/investment" className="text-lake-dark underline">Invest in Asanteman tourism</Link>.</li>
            <li>Want to promote an event or offer? <Link href="/advertise" className="text-lake-dark underline">Advertise with us</Link>.</li>
          </ul>
        </div>
        <div className="lg:col-span-2">
          <EnquiryForm kind="partnership" lockKind subject="a partnership with VisitAsanteman" showOrganisation />
        </div>
      </Container>
    </>
  );
}
