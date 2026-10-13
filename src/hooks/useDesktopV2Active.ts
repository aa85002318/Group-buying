"use client";

import { useIsDesktopLg } from "@/hooks/useIsDesktopLg";
import {
  isDesktopV2AllScreensClient,
  isDesktopV2EnabledClient,
} from "@/lib/features/desktop-v2";

/**
 * True when the website layout (Desktop V2) should render.
 * Staging: every screen size gets the same responsive layout.
 * Production: only computer widths (>= 1024px); phones and tablets keep the
 * app layout.
 */
export function useDesktopV2Active(): boolean {
  const isDesktopLg = useIsDesktopLg();
  if (!isDesktopV2EnabledClient()) return false;
  return isDesktopV2AllScreensClient() || isDesktopLg;
}
