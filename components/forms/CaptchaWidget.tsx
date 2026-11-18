"use client";

import Script from "next/script";
import { useEffect } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
type TurnstileWindow = Window & { turnstile?: { reset: () => void } };

/**
 * Cloudflare Turnstile, for sign-in, sign-up and password-reset forms. It renders only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set;
 * without a key nothing is shown and nothing is sent, so it works while CAPTCHA is switched off in Supabase. When Supabase
 * Authentication, Attack Protection has CAPTCHA switched on with Turnstile, set the same site key here. The widget adds a hidden
 * field "cf-turnstile-response" to the form; the server passes it to Supabase as the CAPTCHA token. A token works once, so the
 * widget is reset after every submission.
 */
export function CaptchaWidget({ resetSignal }: { resetSignal?: unknown }) {
  useEffect(() => { (window as TurnstileWindow).turnstile?.reset(); }, [resetSignal]);
  if (!SITE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      <div className="cf-turnstile min-h-16" data-sitekey={SITE_KEY} data-theme="light" data-size="flexible" />
    </>
  );
}
