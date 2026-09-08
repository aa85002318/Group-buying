"use client";

import type { ReactNode } from "react";
import { useIsDesktopLg } from "@/hooks/useIsDesktopLg";
import { isDesktopV2EnabledClient } from "@/lib/features/desktop-v2";

type DesktopV2GateProps = {
  mobile: ReactNode;
  desktop: ReactNode;
};

/**
 * Mount exactly one tree (mobile XOR desktop) when Desktop V2 is enabled.
 * When the flag is off, always render mobile — production stays unchanged.
 */
export function DesktopV2Gate({ mobile, desktop }: DesktopV2GateProps) {
  const enabled = isDesktopV2EnabledClient();
  const isDesktop = useIsDesktopLg();

  if (!enabled || !isDesktop) return <>{mobile}</>;
  return <>{desktop}</>;
}
