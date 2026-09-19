"use client";

import { useIsDesktopLg } from "@/hooks/useIsDesktopLg";
import { isDesktopV2EnabledClient } from "@/lib/features/desktop-v2";

/** True when Desktop V2 is enabled for this host and viewport is ≥ 1024px. */
export function useDesktopV2Active(): boolean {
  const isDesktopLg = useIsDesktopLg();
  return isDesktopV2EnabledClient() && isDesktopLg;
}
