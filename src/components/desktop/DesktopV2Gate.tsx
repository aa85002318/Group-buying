"use client";

import type { ReactNode } from "react";
import { useDesktopV2Active } from "@/hooks/useDesktopV2Active";

type DesktopV2GateProps = {
  mobile: ReactNode;
  desktop: ReactNode;
};

/**
 * Mount exactly one tree (mobile XOR desktop) when Desktop V2 is enabled.
 * When the flag is off, always render mobile — production stays unchanged.
 */
export function DesktopV2Gate({ mobile, desktop }: DesktopV2GateProps) {
  const desktopV2 = useDesktopV2Active();

  if (!desktopV2) return <>{mobile}</>;
  return <>{desktop}</>;
}
