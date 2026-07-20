"use client";

import { useCallback, useState } from "react";

export type UnifiedSearchHit = {
  type: "product" | "article" | "course" | "livestream" | "faq" | "brand";
  id: string;
  title: string;
  href: string;
  snippet?: string | null;
};

export function useUnifiedSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnifiedSearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { query, results, loading, search, setQuery };
}
