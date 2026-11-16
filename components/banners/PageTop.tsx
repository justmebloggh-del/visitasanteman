import { Banner } from "@/components/banners/Banner";
import { PageHeader } from "@/components/layout/blocks";
import { Container } from "@/components/ui";
import type { BannerKey } from "@/config/banners";
import { getBanner } from "@/lib/content/banners";

/**
 * The top of a page, right under the menu. When the page has a banner (and it is switched on), the banner opens the page:
 * its headline is the h1 and the breadcrumb sits inside it. Otherwise the plain title block is shown, so a page is never
 * left without a heading. The page's own introduction, if any, follows under the banner.
 */
export async function PageTop({ banner, title, intro, crumbs }: { banner?: BannerKey; title: string; intro?: string; crumbs: { label: string; href?: string }[] }) {
  const def = banner ? await getBanner(banner) : null;
  if (!def) return <PageHeader title={title} intro={intro} crumbs={crumbs} />;
  return (
    <>
      <Banner def={def} as="h1" crumbs={crumbs} />
      {intro && <Container className="pt-8"><p className="max-w-3xl text-base text-muted sm:text-lg">{intro}</p></Container>}
    </>
  );
}
