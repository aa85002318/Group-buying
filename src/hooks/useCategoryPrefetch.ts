"use client";

import { useEffect } from "react";
import { prefetchShopRootCategories } from "@/lib/navigation/side-menu-category-cache";

/**
 * Prefetch materials root categories during browser idle time
 * so opening「烘焙材料」can render from cache immediately.
 */
export function useCategoryPrefetch(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      void prefetchShopRootCategories();
    };

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(run, { timeout: 2500 });
    } else {
      timeoutId = setTimeout(run, 800);
    }

    return () => {
      cancelled = true;
      if (idleId != null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled]);
}
