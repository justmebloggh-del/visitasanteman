import { ExternalLink } from "lucide-react";
import { AdImpression } from "@/components/ads/AdImpression";
import { Photo } from "@/components/layout/blocks";
import { Container } from "@/components/ui";
import { getActiveAd } from "@/lib/content/public";

/** Paid placement. Always labelled, links through /api/ads/[id]/click so clicks are counted. */
export async function AdSlot({ placement }: { placement: "homepage_banner" | "directory_top" }) {
  const ad = await getActiveAd(placement);
  if (!ad) return null;
  return (
    <Container className="mt-8">
      <aside aria-label="Sponsored" className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-gold/40 bg-gold-soft p-4 sm:flex-row sm:items-center">
        <AdImpression adId={ad.id} />
        {ad.cover && <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-40"><Photo media={ad.cover} sizes="160px" /></div>}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-earth">Sponsored · {ad.advertiser_name}</p>
          {ad.headline && <h2 className="font-serif text-lg font-semibold text-forest">{ad.headline}</h2>}
          {ad.body && <p className="text-sm text-ink/80">{ad.body}</p>}
        </div>
        <a href={`/api/ads/${ad.id}/click`} rel="sponsored nofollow noopener" target="_blank" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white hover:bg-forest-dark">
          Learn more<ExternalLink className="size-4" aria-hidden /><span className="sr-only"> (sponsored, opens in a new tab)</span>
        </a>
      </aside>
    </Container>
  );
}
