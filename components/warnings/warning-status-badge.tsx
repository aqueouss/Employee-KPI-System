import { Badge } from "@/components/ui/badge";
import type { ReviewStatus, TerminationStatus, WarningStatus } from "@/types/domain";

export function WarningStatusBadge({ status }: { status: WarningStatus }) {
  return (
    <Badge variant={status === "active" ? "destructive" : "secondary"}>
      {status}
    </Badge>
  );
}

export function ReviewStatusBadge({
  status,
}: {
  status: ReviewStatus | TerminationStatus;
}) {
  const variant =
    status === "eligible"
      ? "destructive"
      : status === "under_review"
        ? "warning"
        : status === "resolved"
          ? "success"
          : "secondary";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}
