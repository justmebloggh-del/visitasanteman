import { NextResponse } from "next/server";
import { settlePayment } from "@/lib/payments/settle";
import { paymentsEnabled, verifySignature } from "@/lib/payments/paystack";

export const dynamic = "force-dynamic";

/** Paystack calls this after a charge. The signature proves it came from Paystack; the payment is then re-verified via the API. */
export async function POST(request: Request) {
  if (!paymentsEnabled()) return new NextResponse("Payments disabled", { status: 404 });
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-paystack-signature"))) return new NextResponse("Invalid signature", { status: 401 });

  let event: { event?: string; data?: { reference?: string } };
  try { event = JSON.parse(raw); } catch { return new NextResponse("Bad request", { status: 400 }); }
  if (event.event === "charge.success" && typeof event.data?.reference === "string") {
    const result = await settlePayment(event.data.reference);
    if (result === "error") return new NextResponse("Retry", { status: 500 });   // lets Paystack retry
  }
  return NextResponse.json({ received: true });
}
