"use client";

import { useEffect } from "react";
import { DESKTOP_V2_BOOT_ATTR } from "@/lib/features/desktop-v2";

/**
 * The inline head script flags <html> so CSS can hide the prerendered mobile
 * shell until Desktop V2 mounts. Clear it once the correct tree has committed
 * (two frames after mount) so shrinking the window later still reveals mobile.
 */
export function useClearDesktopBootFlag() {
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        document.documentElement.removeAttribute(DESKTOP_V2_BOOT_ATTR);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);
}
