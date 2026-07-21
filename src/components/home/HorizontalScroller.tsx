"use client";

import { cn } from "@/lib/utils";

type HorizontalScrollerProps = {
  children: React.ReactNode;
  className?: string;
};

/** Shared mobile rail: snap-scrolling on phone, free layout on larger breakpoints. */
export function HorizontalScroller({ children, className }: HorizontalScrollerProps) {
  return <div className={cn("home-scroll", className)}>{children}</div>;
}
