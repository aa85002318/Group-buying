"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured } from "@/lib/config";

type FavoritesContextValue = {
  productIds: Set<string>;
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<{ ok: boolean; favorited: boolean }>;
  refresh: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    fetch("/api/member/favorites")
      .then((r) => (r.ok ? r.json() : { productIds: [] }))
      .then((d) => setProductIds(new Set(d.productIds ?? [])))
      .catch(() => setProductIds(new Set()))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleFavorite = useCallback(async (productId: string) => {
    const wasFavorite = productIds.has(productId);
    setProductIds((prev) => {
      const next = new Set(prev);
      if (wasFavorite) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      if (wasFavorite) {
        const res = await fetch(`/api/member/favorites/${productId}`, { method: "DELETE" });
        if (res.status === 401) {
          window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`;
          return { ok: false, favorited: wasFavorite };
        }
        if (!res.ok) throw new Error("failed");
        return { ok: true, favorited: false };
      }
      const res = await fetch("/api/member/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      if (res.status === 401) {
        setProductIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`;
        return { ok: false, favorited: false };
      }
      if (!res.ok) throw new Error("failed");
      return { ok: true, favorited: true };
    } catch {
      setProductIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return { ok: false, favorited: wasFavorite };
    }
  }, [productIds]);

  const value = useMemo(
    () => ({
      productIds,
      loading,
      isFavorite: (id: string) => productIds.has(id),
      toggleFavorite,
      refresh,
    }),
    [productIds, loading, toggleFavorite, refresh]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
