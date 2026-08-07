"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SideMenuCategory, SideMenuCategorySource } from "@/types/navigation";

const cache = new Map<string, SideMenuCategory[]>();

export function useCategoryNavigation(
  source: SideMenuCategorySource | null,
  parentId?: string | null,
  enabled = true
) {
  const [categories, setCategories] = useState<SideMenuCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comingSoon, setComingSoon] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const key = source ? `${source}:${parentId ?? "root"}` : "";

  const load = useCallback(() => {
    if (!source || !enabled) return;
    if (cache.has(key)) {
      setCategories(cache.get(key)!);
      setError(null);
      setComingSoon(false);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ source });
    if (parentId) params.set("parentId", parentId);

    fetch(`/api/side-menu/categories?${params}`, { signal: ac.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "分類載入失敗");
        return d as {
          categories: SideMenuCategory[];
          comingSoon?: boolean;
        };
      })
      .then((d) => {
        cache.set(key, d.categories ?? []);
        setCategories(d.categories ?? []);
        setComingSoon(Boolean(d.comingSoon));
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "分類載入失敗");
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, [source, parentId, enabled, key]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { categories, loading, error, comingSoon, reload: load };
}

export function invalidateCategoryCache() {
  cache.clear();
}
