import "server-only";

/**
 * Best-effort email via Resend's HTTP API. Returns false (and logs) when it is not
 * configured or fails. Callers must never report an email as sent when this is false.
 * Required env: RESEND_API_KEY, EMAIL_FROM. See docs/ENVIRONMENT_VARIABLES.md.
 */
export async function sendEmail(o: { to: string; subject: string; text: string; replyTo?: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: o.to, subject: o.subject, text: o.text, reply_to: o.replyTo }),
    });
    if (!res.ok) console.error("[email] Resend responded", res.status);
    return res.ok;
  } catch (e) {
    console.error("[email] failed", e);
    return false;
  }
}
