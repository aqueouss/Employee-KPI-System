import { Badge } from "@/components/ui/badge";
import type { RewardStatus } from "@/types/domain";

export function RewardStatusBadge({ status }: { status: RewardStatus }) {
  const variant =
    status === "eligible"
      ? "warning"
      : status === "issued"
        ? "success"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}
