import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/ui";
import { SectionForm } from "@/components/admin/SectionForm";
import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Homepage" };

const LABELS: Record<string, string> = {
  hero: "Hero (top banner)", intro: "Introduction", attractions: "Attractions", experiences: "Experiences", accommodation: "Accommodation",
  restaurants: "Restaurants", communities: "Communities", events: "Events", articles: "Articles", testimonials: "Testimonials", newsletter: "Newsletter",
};

export default async function HomepageAdmin() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.from("homepage_sections").select("*").order("sort_order");
  return (
    <>
      <AdminHeader title="Homepage" intro="Edit headings and switch sections on or off. Sections with nothing published are hidden automatically, even when switched on." />
      <ul className="space-y-5">
        {(data ?? []).map((s) => {
          const cfg = (s.config ?? {}) as { media_id?: string; image_path?: string; image_alt?: string };
          const hero = s.key === "hero" && cfg.media_id && cfg.image_path ? [{ id: cfg.media_id, path: cfg.image_path, alt_text: cfg.image_alt ?? "" }] : [];
          return (
            <li key={s.key} className="rounded-2xl border border-line bg-white p-5 sm:p-6">
              <h2 className="mb-3 font-serif text-lg font-semibold text-forest">{LABELS[s.key] ?? s.key}</h2>
              <SectionForm s={s} hero={hero} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
