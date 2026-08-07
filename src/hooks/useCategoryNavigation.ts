"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SideMenuCategory, SideMenuCategorySource } from "@/types/navigation";
import {
  fetchSideMenuCategories,
  getCachedCategories,
  revalidateSideMenuCategories,
} from "@/lib/navigation/side-menu-category-cache";

export function useCategoryNavigation(
  source: SideMenuCategorySource | null,
  parentId?: string | null,
  enabled = true
) {
  const cached = source ? getCachedCategories(source, parentId) : null;
  const [categories, setCategories] = useState<SideMenuCategory[]>(
    () => cached?.categories ?? []
  );
  const [loading, setLoading] = useState(() => enabled && Boolean(source) && !cached);
  const [error, setError] = useState<string | null>(null);
  const [comingSoon, setComingSoon] = useState(() => Boolean(cached?.comingSoon));
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(
    (opts?: { force?: boolean }) => {
      if (!source || !enabled) return;

      const hit = getCachedCategories(source, parentId);
      if (hit && !opts?.force) {
        setCategories(hit.categories);
        setComingSoon(Boolean(hit.comingSoon));
        setError(null);
        setLoading(false);
        revalidateSideMenuCategories(source, parentId);
        return;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const reqId = ++requestIdRef.current;

      // Only show loading skeleton when we have nothing to display
      if (!hit) setLoading(true);
      setError(null);

      fetchSideMenuCategories(source, parentId, {
        signal: ac.signal,
        force: opts?.force,
      })
        .then((entry) => {
          if (reqId !== requestIdRef.current) return;
          setCategories(entry.categories);
          setComingSoon(Boolean(entry.comingSoon));
          setError(null);
        })
        .catch((e) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          if (reqId !== requestIdRef.current) return;
          setError(e instanceof Error ? e.message : "分類載入失敗");
          if (!hit) setCategories([]);
        })
        .finally(() => {
          if (reqId === requestIdRef.current) setLoading(false);
        });
    },
    [source, parentId, enabled]
  );

  useEffect(() => {
    if (!enabled || !source) {
      setLoading(false);
      return;
    }
    load();
    return () => {
      abortRef.current?.abort();
    };
  }, [enabled, source, parentId, load]);

  return {
    categories,
    loading,
    error,
    comingSoon,
    reload: () => load({ force: true }),
    hasCache: Boolean(cached),
  };
}

export function invalidateCategoryCache() {
  // Kept for API compat — prefer module cache helpers
}
