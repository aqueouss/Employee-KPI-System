import { Badge } from "@/components/ui/badge";
import type { KpiFlag } from "@/types/domain";

const FLAG_CONFIG: Record<
  KpiFlag,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary" }
> = {
  green: { label: "Green", variant: "success" },
  yellow: { label: "Yellow", variant: "warning" },
  red: { label: "Red", variant: "destructive" },
  no_tasks: { label: "No tasks", variant: "secondary" },
};

export function FlagBadge({ flag }: { flag: KpiFlag }) {
  const config = FLAG_CONFIG[flag];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
