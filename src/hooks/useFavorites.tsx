"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured } from "@/lib/config";
import type { FavoriteTargetType } from "@/lib/types/database";

function keyOf(type: FavoriteTargetType, id: string) {
  return `${type}:${id}`;
}

type FavoritesContextValue = {
  keys: Set<string>;
  productIds: Set<string>;
  loading: boolean;
  isFavorite: (type: FavoriteTargetType, id: string) => boolean;
  toggleFavorite: (
    type: FavoriteTargetType,
    id: string
  ) => Promise<{ ok: boolean; favorited: boolean }>;
  refresh: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    fetch("/api/member/favorites")
      .then((r) => (r.ok ? r.json() : { keys: [], productIds: [] }))
      .then((d) => {
        if (Array.isArray(d.keys) && d.keys.length) {
          setKeys(new Set(d.keys));
        } else {
          setKeys(new Set((d.productIds ?? []).map((id: string) => keyOf("product", id))));
        }
      })
      .catch(() => setKeys(new Set()))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleFavorite = useCallback(
    async (type: FavoriteTargetType, id: string) => {
      const k = keyOf(type, id);
      const wasFavorite = keys.has(k);
      setKeys((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(k);
        else next.add(k);
        return next;
      });

      try {
        if (wasFavorite) {
          const res = await fetch(
            `/api/member/favorites/${encodeURIComponent(id)}?type=${type}`,
            { method: "DELETE" }
          );
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
          body: JSON.stringify({ target_type: type, target_id: id }),
        });
        if (res.status === 401) {
          setKeys((prev) => {
            const next = new Set(prev);
            next.delete(k);
            return next;
          });
          window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`;
          return { ok: false, favorited: false };
        }
        if (!res.ok) throw new Error("failed");
        return { ok: true, favorited: true };
      } catch {
        setKeys((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(k);
          else next.delete(k);
          return next;
        });
        return { ok: false, favorited: wasFavorite };
      }
    },
    [keys]
  );

  const value = useMemo(() => {
    const productIds = new Set(
      Array.from(keys)
        .filter((k) => k.startsWith("product:"))
        .map((k) => k.slice("product:".length))
    );
    return {
      keys,
      productIds,
      loading,
      isFavorite: (type: FavoriteTargetType, id: string) => keys.has(keyOf(type, id)),
      toggleFavorite,
      refresh,
    };
  }, [keys, loading, toggleFavorite, refresh]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
