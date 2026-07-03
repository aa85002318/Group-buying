import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";

export function StatusBadge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: BadgeProps["variant"];
}) {
  return <Badge variant={variant}>{label}</Badge>;
}
