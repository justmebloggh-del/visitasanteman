# Payments and bookings

## Lifecycle
`pending` → provider/staff **confirms** (and sets the price) → `confirmed` → **request payment** → `awaiting_payment` → customer pays → `paid` → `completed`. Cancellation is possible before payment by the customer, and by the provider/staff with a reason. `refunded` is recorded by an administrator after money has actually been returned.

Rules enforced in the database (`set_booking_status`):
- Nothing is confirmed automatically. A customer can never set a price or mark anything paid.
- Prices are fixed before payment is requested and cannot change afterwards.
- A booking can only be marked `paid` by server code that has verified the payment with the gateway.
- Every change is written to `booking_status_history` and audited.

## How a payment is secured
1. Customer presses *Pay*. The server reads the **amount from the database** (never from the browser), creates a `booking_payments` row and initialises a Paystack transaction.
2. Customer pays on Paystack and returns to `/booking/payment-return`. The URL is **not trusted**: the server asks Paystack to verify the transaction.
3. A payment is accepted only if Paystack says `success` **and** the reference, amount (in pesewas) and currency match what we stored **and** the booking is still `awaiting_payment`. Anything else marks the payment `failed` and leaves the booking unpaid.
4. `POST /api/webhooks/paystack` verifies Paystack's `x-paystack-signature` (HMAC-SHA512) and then runs the same verification, so a forged webhook cannot mark anything paid. Replays are harmless (idempotent).
5. Commission = plan `commission_percent` × amount, recorded on the booking at payment time. Nothing is deducted or paid out automatically; reconcile payouts separately.

Only `lib/payments/*` uses the Supabase **service-role key** (to write verified results). It is server-only.

## Going live (do these in order)
1. Create a Paystack account and complete business verification (KYC). Confirm which methods your account supports (Mobile Money, cards).
2. **Test mode first.** Set `PAYSTACK_SECRET_KEY` to the **test** secret key, `SUPABASE_SERVICE_ROLE_KEY`, and `PAYMENTS_ENABLED=true` in a Vercel *Preview* environment. In the Paystack dashboard set the webhook URL to `https://<preview-domain>/api/webhooks/paystack`.
3. Run test payments: success, abandoned/failed, and a Mobile Money flow. Confirm the booking turns `paid`, the webhook is received, and a refund recorded in admin matches a refund made in the Paystack dashboard.
4. Review the commission percentages in *Admin → Subscription plans*, and have terms (cancellation/refund policy) reviewed before charging real money.
5. Only then set the **live** key and `PAYMENTS_ENABLED=true` in Production.

If `PAYMENTS_ENABLED` is not `true` or no key is set, the site simply shows "Online payment is not available yet" and providers arrange payment directly.

## Not included
- **Hubtel** is not integrated. The payment code is isolated in `lib/payments/` so a second provider can be added behind the same `settlePayment` flow once you have Hubtel merchant credentials.
- **Automatic refunds via the gateway API.** Refunds are made in the Paystack dashboard and then *recorded* in admin.
- **Automatic payouts to providers.**
- Real-time channel-manager style availability. Availability = provider-blocked dates + one unit per active booking.
