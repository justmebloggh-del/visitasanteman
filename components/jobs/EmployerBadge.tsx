import { Badge } from "@/components/ui";
import { employerStatusLabels, type EmployerStatus } from "@/config/jobs";

export function EmployerBadge({ status }: { status: string }) {
  const s = (status in employerStatusLabels ? status : "unverified") as EmployerStatus;
  return <Badge tone={s === "verified" ? "green" : s === "pending" ? "gold" : s === "suspended" ? "red" : "neutral"}>{employerStatusLabels[s]}</Badge>;
}
