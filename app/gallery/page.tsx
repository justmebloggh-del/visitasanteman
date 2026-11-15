import { MediaBanner } from "@/components/banners";
import type { Metadata } from "next";
import { PageHeader, Photo, StaticPhoto } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { images as builtIn, type ImageKey } from "@/config/images";
import { getAllGalleryImages } from "@/lib/content/public";

// Built-in photographs (public/Asante), shown after any uploaded gallery photos. The chart and the map are not photographs.
const BUILT_IN: ImageKey[] = ["festival", "kenteDisplay", "chief", "regalia", "regaliaBearer", "kenteLoom", "artisans", "fufu", "celebration", "lake", "waterfall", "jetty"];

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({ title: "Gallery", description: "Photographs of Asanteman, its places and its people.", path: "/gallery" });

export default async function GalleryPage() {
  const images = await getAllGalleryImages();
  return (
    <>
      <PageHeader title="Gallery" intro="Asanteman in pictures." crumbs={[{ label: "Gallery" }]} />
      <MediaBanner />
      <Container className="py-10">
        {images.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {images.map((m) => (
              <li key={m.path}><figure><div className="relative aspect-square overflow-hidden rounded-xl"><Photo media={m} sizes="(min-width:1024px) 25vw, 50vw" /></div>
                {(m.caption || m.credit) && <figcaption className="mt-1 text-xs text-muted">{m.caption}{m.credit ? ` (${m.credit})` : ""}</figcaption>}</figure></li>
            ))}
          </ul>
        )}
        {/* Built-in photographs keep their own proportions (nothing is cropped or enlarged), laid out in columns. */}
        <ul className={`columns-2 gap-3 md:columns-3 lg:columns-4 ${images.length > 0 ? "mt-3" : ""}`}>
          {BUILT_IN.map((k) => (
            <li key={k} className="mb-3 break-inside-avoid"><figure>
              <StaticPhoto image={k} className="w-full rounded-xl" sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" />
              <figcaption className="mt-1 text-xs text-muted">{builtIn[k].caption}</figcaption></figure></li>
          ))}
        </ul>
      </Container>
    </>
  );
}
