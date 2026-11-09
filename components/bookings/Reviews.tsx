import { Star } from "lucide-react";
import type { ReviewItem } from "@/lib/content/public";
import { formatDate } from "@/lib/utils";

export function Reviews({ items, average, count }: { items: ReviewItem[]; average: number | null; count: number }) {
  if (!count) return null;
  return (
    <section>
      <h2 className="mb-1 text-2xl font-semibold text-forest">Reviews</h2>
      <p className="mb-4 flex items-center gap-2 text-sm text-muted"><Star className="size-4 fill-gold text-gold" aria-hidden /><strong className="text-ink">{average}</strong> out of 5 from {count} verified guest{count > 1 ? "s" : ""}</p>
      <ul className="space-y-4">
        {items.slice(0, 10).map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
            <p className="flex items-center gap-2 text-sm"><span className="flex" aria-label={`${r.rating} out of 5`}>{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="size-4 fill-gold text-gold" />)}</span><strong>{r.author_name}</strong><span className="text-muted">{formatDate(r.created_at)}</span></p>
            {r.comment && <p className="mt-2 text-sm text-ink/90">{r.comment}</p>}
            {r.owner_reply && <p className="mt-3 border-l-2 border-gold pl-3 text-sm text-muted"><strong className="text-ink">Reply from the provider:</strong> {r.owner_reply}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
