import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/ui";
import { BannerForm } from "@/components/admin/BannerForm";
import { bannerKeys, resolveBanner } from "@/config/banners";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Banners" };

export default async function BannersAdmin() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "banners").maybeSingle();
  return (
    <>
      <AdminHeader title="Banners" intro="The words, buttons and on/off switch of every banner. The kente pattern, the gold emblem and the photographs are part of the design. Banners about programmes that are not running yet should stay off." />
      <div className="space-y-4">
        {bannerKeys.map((k) => {
          const def = resolveBanner(k, data?.value);
          return (
            <details key={k} className="rounded-2xl border border-line bg-white p-5" open={k === "hero"}>
              <summary className="cursor-pointer font-serif text-lg font-semibold text-forest">{def.name}{!def.enabled && <span className="ml-2 text-sm font-normal text-muted">(off)</span>}</summary>
              <div className="mt-4"><BannerForm def={def} /></div>
            </details>
          );
        })}
      </div>
    </>
  );
}
