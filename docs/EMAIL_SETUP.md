# Account emails (Supabase Auth + Resend)

Sign-up confirmation, password reset and sign-in emails are sent by Supabase Auth. By default they come from
Supabase's shared sender. To send them as VisitAsanteman, use Resend as custom SMTP.

## 1. Resend
- Domain `visitasanteman.com` must show **Verified** in Resend (Domains). Add the SPF, DKIM and (recommended) DMARC records it lists at your DNS host.
- Create an API key (Sending access). Never commit it or paste it in chat.

## 2. Supabase → Authentication → Emails → SMTP Settings
Enable custom SMTP. Automated mail goes out as `noreply@`; `info@visitasanteman.com` is the real mailbox for sending and receiving, so it is the contact address shown in the emails and on the site. Resend can send from any address on the verified domain, so `noreply@` needs no mailbox of its own.

| Field | Value |
|---|---|
| Sender email | `noreply@visitasanteman.com` |
| Sender name | `VisitAsanteman` |
| Host | `smtp.resend.com` |
| Port | `465` (SSL) |
| Username | `resend` |
| Password | your Resend API key |

Then raise the email rate limit (Authentication → Rate Limits) from the very low default.

## 3. Supabase → Authentication → Emails → Templates
Paste each file from `docs/email-templates/` into the matching template and set the subject:

| Template | File | Subject |
|---|---|---|
| Confirm sign up | `confirm-signup.html` | Confirm your VisitAsanteman account |
| Reset password | `reset-password.html` | Reset your VisitAsanteman password |
| Magic link | `magic-link.html` | Your VisitAsanteman sign-in link |
| Change email address | `change-email.html` | Confirm your new email address |

## 4. URL Configuration
- Site URL: `https://www.visitasanteman.com`
- Redirect URLs: `https://www.visitasanteman.com/auth/callback`

## 5. Test
Register a new account on the live site and check the email arrives, from "VisitAsanteman", in the inbox.
The link inside still passes through the project's `supabase.co` address; only a paid Supabase custom domain hides that.
