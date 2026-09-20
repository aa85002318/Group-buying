"use client";

import { isDesktopV2EnabledClient } from "@/lib/features/desktop-v2";

/**
 * True when the single responsive website layout (Desktop V2) is enabled for
 * this host. Since ④ it no longer depends on screen width: phones, tablets and
 * computers all get the same layout, which reflows by breakpoint.
 * (Production stays on the legacy app layout until go-live.)
 */
export function useDesktopV2Active(): boolean {
  return isDesktopV2EnabledClient();
}
