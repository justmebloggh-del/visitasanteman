import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/blocks";
import { LookupForm } from "@/components/bookings/LookupForm";
import { Container, Notice } from "@/components/ui";
import { paymentsEnabled } from "@/lib/payments/paystack";

export const metadata: Metadata = { title: "Check your booking", robots: { index: false } };
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  "payments-off": "Online payment is not available.", rate: "Too many attempts. Please wait a few minutes.",
  "not-payable": "That booking is not ready for payment.", payment: "We could not start the payment. Nothing was charged. Please try again.",
};

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Check your booking" intro="Enter the reference from your confirmation and the email you used." crumbs={[{ label: "Booking" }]} />
      <Container className="max-w-3xl py-10">
        {sp.error && <div className="mb-5"><Notice tone="error">{errors[sp.error] ?? "Something went wrong."}</Notice></div>}
        <LookupForm paymentsOn={paymentsEnabled()} />
      </Container>
    </>
  );
}
