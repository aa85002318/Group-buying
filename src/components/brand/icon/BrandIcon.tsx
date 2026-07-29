import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import { brandIconMap, type BrandIconKey } from "./icon-map";

export function BrandIcon({
  name,
  className,
  size = 20,
  strokeWidth = 1.75,
  "aria-hidden": ariaHidden = true,
  title,
}: {
  name: BrandIconKey | string;
  className?: string;
  size?: number;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
  title?: string;
}) {
  const Icon =
    (name in brandIconMap
      ? brandIconMap[name as BrandIconKey]
      : CircleHelp) ?? CircleHelp;

  return (
    <Icon
      className={cn("shrink-0", className)}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={title ? undefined : ariaHidden}
      role={title ? "img" : undefined}
      aria-label={title}
    />
  );
}
