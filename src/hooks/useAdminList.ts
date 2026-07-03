"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export function useAdminList<T extends object>(
  apiPath: string,
  dataKey: string,
  searchKeys: string[] = []
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiPath);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      const list = (data[dataKey] ?? []) as T[];
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [apiPath, dataKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) =>
      searchKeys.some((key) => String((item as Record<string, unknown>)[key] ?? "").toLowerCase().includes(q))
    );
  }, [items, search, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return {
    items,
    setItems,
    loading,
    error,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    totalPages,
    filtered,
    paginated,
    refresh,
  };
}
