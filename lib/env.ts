export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** False until Supabase credentials are provided; the public site then renders empty states. */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** The live address. Used only on Vercel's production deployment, and only when the setting below is missing or still points at localhost. */
const LIVE_URL = "https://www.visitasanteman.com";
const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
const onLiveDeployment = process.env.VERCEL_ENV === "production";
export const SITE_URL = (onLiveDeployment && /localhost|127\.0\.0\.1/.test(configured) ? LIVE_URL : configured).replace(/\/$/, "");
