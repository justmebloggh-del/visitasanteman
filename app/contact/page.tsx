import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { getSettings } from "@/lib/content/public";
import { whatsappLink } from "@/lib/utils";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({ title: "Contact us", description: "Questions about visiting Asanteman, listing your business or partnering with us.", path: "/contact" });

const KINDS = ["general", "accommodation", "experience", "table_reservation", "investment", "partnership", "business_listing"];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const settings = await getSettings();
  const c = settings.contact ?? {};
  const wa = whatsappLink(String(c.whatsapp ?? ""));
  return (
    <>
      <PageHeader title="Contact us" intro="Ask a question, list your business or talk to us about partnerships." crumbs={[{ label: "Contact" }]} />
      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2"><EnquiryForm kind={KINDS.includes(kind ?? "") ? kind : "general"} /></div>
        <aside className="space-y-4 text-sm">
          {c.email && <p className="flex gap-2"><Mail className="size-4 shrink-0 text-forest" aria-hidden /><a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a></p>}
          {c.phone && <p className="flex gap-2"><Phone className="size-4 shrink-0 text-forest" aria-hidden />{c.phone}</p>}
          {c.address && <p className="flex gap-2"><MapPin className="size-4 shrink-0 text-forest" aria-hidden />{c.address}</p>}
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-full bg-[#1f8f4e] px-5 font-medium text-white">Chat on WhatsApp</a>}
          {!c.email && !c.phone && !c.address && !wa && <p className="text-muted">Use the form and we will reply by email.</p>}
        </aside>
      </Container>
    </>
  );
}
