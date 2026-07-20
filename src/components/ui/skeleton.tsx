import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("skeleton", className)} {...props} />
  )
);
Skeleton.displayName = "Skeleton";
