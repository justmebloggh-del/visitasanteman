import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Container } from "@/components/ui";
import { paymentsEnabled } from "@/lib/payments/paystack";
import { settlePayment } from "@/lib/payments/settle";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Paystack sends the customer back here. We never trust the URL: the payment is verified with Paystack server-side. */
export default async function PaymentReturn({ searchParams }: { searchParams: Promise<{ reference?: string; trxref?: string }> }) {
  const sp = await searchParams;
  const ref = (sp.reference ?? sp.trxref ?? "").slice(0, 60);
  const result = paymentsEnabled() && /^VLBP-[A-Z0-9]+$/.test(ref) ? await settlePayment(ref) : "unknown";
  const ok = result === "paid" || result === "already_paid";
  const pending = result === "error";
  return (
    <Container className="max-w-xl py-20 text-center">
      {ok ? <CheckCircle2 className="mx-auto size-12 text-forest" aria-hidden /> : pending ? <Clock className="mx-auto size-12 text-gold" aria-hidden /> : <XCircle className="mx-auto size-12 text-red-700" aria-hidden />}
      <h1 className="mt-4 text-3xl font-semibold text-forest">{ok ? "Payment received" : pending ? "Payment is still processing" : "Payment not completed"}</h1>
      <p className="mt-3 text-muted">
        {ok ? "Thank you. Your booking is secured and the provider has been notified."
          : pending ? "We have not received confirmation yet. Check your booking in a few minutes. If you were charged it will update automatically."
          : "No payment was recorded. You can try again from your booking page. If you were charged, contact us with your booking reference."}
      </p>
      <Link href="/booking" className="mt-6 inline-block text-lake-dark underline">Go to your booking</Link>
    </Container>
  );
}
