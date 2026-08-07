"use client";

import { useCallback, useEffect, useState } from "react";
import type { RecentBrowseItem } from "@/types/navigation";

const BROWSE_KEY = "chimeidiy:side-menu:recent-browse";
const SEARCH_KEY = "chimeidiy:side-menu:recent-search";
const MAX_BROWSE = 5;
const MAX_SEARCH = 6;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useRecentItems() {
  const [recentBrowse, setRecentBrowse] = useState<RecentBrowseItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentBrowse(readJson<RecentBrowseItem[]>(BROWSE_KEY, []));
    setRecentSearches(readJson<string[]>(SEARCH_KEY, []));
  }, []);

  const pushBrowse = useCallback((item: Omit<RecentBrowseItem, "at">) => {
    setRecentBrowse((prev) => {
      const next = [
        { ...item, at: Date.now() },
        ...prev.filter((p) => p.id !== item.id && p.href !== item.href),
      ].slice(0, MAX_BROWSE);
      window.localStorage.setItem(BROWSE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const pushSearch = useCallback((q: string) => {
    const term = q.trim();
    if (term.length < 2) return;
    setRecentSearches((prev) => {
      const next = [term, ...prev.filter((p) => p !== term)].slice(0, MAX_SEARCH);
      window.localStorage.setItem(SEARCH_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeSearch = useCallback((term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((p) => p !== term);
      window.localStorage.setItem(SEARCH_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    window.localStorage.removeItem(SEARCH_KEY);
  }, []);

  return {
    recentBrowse,
    recentSearches,
    pushBrowse,
    pushSearch,
    removeSearch,
    clearSearches,
  };
}
