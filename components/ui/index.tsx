import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ── Buttons ── (class helper so <Link> and <button> share one look) */
const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-60 disabled:pointer-events-none";
const variants = {
  primary: "bg-forest text-white hover:bg-forest-dark",
  accent: "bg-gold text-ink hover:brightness-95",
  outline: "border border-forest/30 text-forest hover:bg-forest-soft",
  ghost: "text-forest hover:bg-forest-soft",
  light: "bg-white text-forest hover:bg-mist",
  danger: "bg-red-700 text-white hover:bg-red-800",
};
const sizes = { sm: "h-9 px-4 text-sm", md: "h-11 px-6 text-sm", lg: "h-12 px-8 text-base" };

export function buttonClasses(variant: keyof typeof variants = "primary", size: keyof typeof sizes = "md", extra?: string) {
  return cn(base, variants[variant], sizes[size], extra);
}

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & {
  variant?: keyof typeof variants; size?: keyof typeof sizes;
}) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & {
  variant?: keyof typeof variants; size?: keyof typeof sizes;
}) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}

/* ── Form controls ── */
const control =
  "w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink placeholder:text-muted/70 focus:border-lake focus:outline-none focus:ring-2 focus:ring-lake/25 disabled:bg-mist";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "py-2.5 min-h-28", className)} {...props} />;
}
export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "h-11", className)} {...props} />;
}

export function Field({ label, htmlFor, error, hint, children, className }: {
  label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      {label && <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

/* ── Misc ── */
export function Badge({ children, tone = "neutral", className }: {
  children: ReactNode; tone?: "neutral" | "green" | "blue" | "gold" | "red"; className?: string;
}) {
  const tones = {
    neutral: "bg-mist text-muted", green: "bg-forest-soft text-forest", blue: "bg-lake-soft text-lake-dark",
    gold: "bg-gold-soft text-earth", red: "bg-red-50 text-red-700",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  const tones = { info: "bg-lake-soft text-lake-dark", success: "bg-forest-soft text-forest", error: "bg-red-50 text-red-700" };
  return <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-lg px-4 py-3 text-sm", tones[tone])}>{children}</div>;
}
