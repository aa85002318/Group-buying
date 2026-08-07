"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SideMenuSearchResponse } from "@/types/navigation";

const empty = (q = ""): SideMenuSearchResponse => ({
  query: q,
  page: 1,
  limit: 20,
  hasMore: false,
  products: [],
  categories: [],
  recipes: [],
  brands: [],
});

export function useGlobalSearch(query: string, enabled: boolean) {
  const [data, setData] = useState<SideMenuSearchResponse>(empty());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const q = query.trim();
    if (q.length < 2) {
      setData(empty(q));
      setLoading(false);
      setError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(null);
      fetch(`/api/side-menu/search?q=${encodeURIComponent(q)}&page=1&limit=20`, {
        signal: ac.signal,
      })
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error ?? "搜尋發生錯誤");
          return d as SideMenuSearchResponse;
        })
        .then((d) => setData(d))
        .catch((e) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setError(e instanceof Error ? e.message : "搜尋發生錯誤，請重新搜尋。");
          setData(empty(q));
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [query, enabled]);

  const loadMore = useCallback(async () => {
    const q = query.trim();
    if (!data.hasMore || loading || q.length < 2) return;
    setLoading(true);
    try {
      const next = data.page + 1;
      const r = await fetch(
        `/api/side-menu/search?q=${encodeURIComponent(q)}&page=${next}&limit=20`
      );
      const d = (await r.json()) as SideMenuSearchResponse;
      if (!r.ok) throw new Error("搜尋發生錯誤");
      setData((prev) => ({
        ...d,
        products: [...prev.products, ...d.products],
      }));
    } catch {
      setError("搜尋發生錯誤，請重新搜尋。");
    } finally {
      setLoading(false);
    }
  }, [data.hasMore, data.page, loading, query]);

  return { data, loading, error, loadMore };
}
