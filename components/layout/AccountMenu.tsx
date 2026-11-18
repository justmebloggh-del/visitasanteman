"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClasses } from "@/components/ui";
import { supabaseConfigured } from "@/lib/env";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type State = { loading: true } | { loading: false; signedIn: boolean; staff: boolean; partner?: boolean };

/**
 * Display-only. Whether a user may see /admin is decided on the server (layout + RLS);
 * this just decides which links to show.
 */
export function AccountMenu({ stacked, onDark }: { stacked?: boolean; /** Sits on the dark kente top bar. */ onDark?: boolean }) {
  const [state, setState] = useState<State>(supabaseConfigured ? { loading: true } : { loading: false, signedIn: false, staff: false });
  const router = useRouter();

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createBrowserSupabase();
    let active = true;
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) { setState({ loading: false, signedIn: false, staff: false }); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
      if (active) setState({ loading: false, signedIn: true, staff: ["super_admin", "admin", "regional_editor", "editor", "media_manager"].includes(role?.role ?? ""), partner: role?.role === "partner" });
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  if (state.loading) return <div className="h-10 w-28" aria-hidden />;

  const ghost = onDark ? "text-white hover:bg-white/10" : undefined;
  const wrap = cn("flex items-center gap-2 whitespace-nowrap", stacked && "flex-col items-stretch");

  if (!state.signedIn) {
    return (
      <div className={wrap}>
        <Link href="/login" className={buttonClasses("ghost", "sm", stacked ? "border border-line" : ghost)}>Log in</Link>
        <Link href="/register" className={buttonClasses(onDark ? "light" : "primary", "sm")}>Register</Link>
      </div>
    );
  }
  return (
    <div className={wrap}>
      {state.staff && <Link href="/admin" className={buttonClasses(onDark ? "light" : "outline", "sm")}>Admin</Link>}
      <Link href="/account" className={buttonClasses("ghost", "sm", stacked ? "border border-line" : ghost)}>My account</Link>
      {state.partner && <Link href="/partner/dashboard" className={buttonClasses(onDark ? "light" : "outline", "sm")}>Partner portal</Link>}
      <button
        type="button"
        className={buttonClasses("ghost", "sm", stacked ? "border border-line" : ghost)}
        onClick={async () => { await createBrowserSupabase().auth.signOut(); router.refresh(); }}
      >
        Sign out
      </button>
    </div>
  );
}
