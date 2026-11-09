import type { Metadata } from "next";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";

export const metadata: Metadata = buildMetadata({
  title: "Advertise with VisitAsanteman",
  description: "Reach people planning a visit to the Ashanti Region with clearly labelled sponsored placements.",
  path: "/advertise",
});

export default function AdvertisePage() {
  return (
    <>
      <PageHeader title="Advertise with VisitAsanteman" intro="Reach people planning a visit to the Ashanti Region." crumbs={[{ label: "Advertise" }]} />
      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        <div className="space-y-4 text-ink/90 lg:col-span-1">
          <p>Sponsored placements can appear on the homepage and at the top of directory pages. Every advertisement is reviewed by our team and is always labelled <strong>Sponsored</strong>, so visitors can tell it apart from our own listings.</p>
          <p>There is no online purchase yet. Tell us about your business and what you would like to promote, and we will reply by email with the available placements and terms.</p>
          <p className="text-sm text-muted">Looking for a free or paid business listing instead? See <a className="text-lake-dark underline" href="/partner">List your business</a>.</p>
        </div>
        <div className="lg:col-span-2">
          <EnquiryForm kind="partnership" lockKind subject="advertising on VisitAsanteman" showOrganisation />
        </div>
      </Container>
    </>
  );
}
