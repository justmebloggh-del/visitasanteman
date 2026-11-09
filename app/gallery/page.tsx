import type { Metadata } from "next";
import { EmptyState, PageHeader, Photo } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { getAllGalleryImages } from "@/lib/content/public";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({ title: "Gallery", description: "Photographs of the Ashanti Region, its places and its people.", path: "/gallery" });

export default async function GalleryPage() {
  const images = await getAllGalleryImages();
  return (
    <>
      <PageHeader title="Gallery" intro="The Ashanti Region in pictures." crumbs={[{ label: "Gallery" }]} />
      <Container className="py-10">
        {images.length === 0 ? <EmptyState title="Photographs are coming soon" text="Photos uploaded to the “gallery” folder of the media library appear here." /> : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {images.map((m) => (
              <li key={m.path}><figure><div className="relative aspect-square overflow-hidden rounded-xl"><Photo media={m} sizes="(min-width:1024px) 25vw, 50vw" /></div>
                {(m.caption || m.credit) && <figcaption className="mt-1 text-xs text-muted">{m.caption}{m.credit ? ` (${m.credit})` : ""}</figcaption>}</figure></li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
