import Image from "next/image";
import Link from "next/link";
import { images } from "@/config/images";
import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("culture-traditions", "Traditions", "/culture/traditions");

export default function Page() {
  return (
    <CmsPage slug="culture-traditions" fallbackTitle="Traditions" banner="arts" crumbs={[{ label: "Culture & Heritage", href: "/culture" }]}>
      <section className="mt-10" aria-labelledby="adinkra">
        <h2 id="adinkra" className="mb-2 text-2xl font-semibold text-forest">Adinkra symbols</h2>
        <p className="mb-4 max-w-2xl text-muted">Adinkra cloth printing is one of the crafts above. Each symbol has a name and a meaning that belongs to the tradition, so we show the names only and leave the meanings to the people who keep them.</p>
        <figure className="max-w-3xl">
          <Image src={images.adinkraChart.src} alt={images.adinkraChart.alt} width={images.adinkraChart.width} height={images.adinkraChart.height} sizes="(min-width:768px) 768px, 100vw" quality={90} className="h-auto w-full rounded-2xl border border-line bg-white" />
          <figcaption className="mt-2 text-sm text-muted">{images.adinkraChart.caption}</figcaption>
        </figure>
      </section>
      <p className="mt-8 text-sm text-muted"><Link href="/culture" className="text-lake-dark underline">Back to Culture & Heritage</Link></p>
    </CmsPage>
  );
}
