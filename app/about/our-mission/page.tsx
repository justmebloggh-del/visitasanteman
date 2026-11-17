import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";
import { ourMission } from "@/config/legal";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("about-our-mission", "Our mission", "/about/our-mission");

export default function Page() {
  return (
    <CmsPage slug="about-our-mission" fallbackTitle="Our mission" crumbs={[{ label: "About us", href: "/about" }]}
      fallback={
        <div className="max-w-3xl space-y-8 text-lg leading-relaxed text-ink">
          <section><h2 className="font-serif text-2xl font-semibold text-forest">Our mission</h2><p className="mt-3">{ourMission.mission}</p></section>
          <section><h2 className="font-serif text-2xl font-semibold text-forest">Our vision</h2><p className="mt-3">{ourMission.vision}</p></section>
          <section><h2 className="font-serif text-2xl font-semibold text-forest">What we aim to do</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 marker:text-gold">{ourMission.aims.map(([a, b]) => <li key={a}><strong>{a}</strong>, {b}</li>)}</ul>
          </section>
        </div>
      } />
  );
}
