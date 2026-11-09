import { Badge } from "@/components/ui";
import { stageLabels, stageNotice, type ProjectStage } from "@/config/site";

const tone = { operational: "green", approved: "blue", proposed: "gold", under_consideration: "neutral" } as const;

export function StageBadge({ stage, className }: { stage: ProjectStage; className?: string }) {
  return <Badge tone={tone[stage]} className={className}>{stageLabels[stage]}</Badge>;
}

export function StageNotice({ stage, source }: { stage: ProjectStage; source?: string | null }) {
  const text = stageNotice[stage];
  if (!text && !source) return null;
  return (
    <div role="note" className="rounded-2xl border border-gold/50 bg-gold-soft p-4 text-sm text-ink">
      <strong>{stageLabels[stage]}.</strong> {text}
      {source && <p className="mt-1 text-xs text-muted"><strong className="text-ink">Source:</strong> {source}</p>}
    </div>
  );
}
