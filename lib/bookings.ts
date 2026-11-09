export interface BookingRow {
  id: string; reference: string; kind: "accommodation" | "experience" | "table"; title: string | null;
  status: string; payment_status: string; total_amount: number | null; currency: string; guests: number;
  check_in: string | null; check_out: string | null; booking_date: string | null; booking_time: string | null;
  customer_name: string; created_at: string; can_review: boolean; reviewed: boolean;
}

export const statusLabels: Record<string, string> = {
  pending: "Pending confirmation", confirmed: "Confirmed", awaiting_payment: "Awaiting payment", paid: "Paid",
  cancelled: "Cancelled", completed: "Completed", refunded: "Refunded",
};

export const statusHelp: Record<string, string> = {
  pending: "The provider has not confirmed yet. Nothing is booked until they do.",
  confirmed: "The provider has confirmed your request.",
  awaiting_payment: "The provider has confirmed and set a price. You can pay online below.",
  paid: "Payment received. Your booking is secured.",
  cancelled: "This booking was cancelled.", completed: "This booking is complete.", refunded: "This booking was refunded.",
};

/** Postgres RAISE EXCEPTION errors carry code P0001. Their text is written for users, others are not shown. */
export const isUserFacing = (e: { code?: string }) => e.code === "P0001";
