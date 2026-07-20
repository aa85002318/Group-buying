"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, HeartOff } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { formatCurrency, cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/site-links";
import type { FavoriteTargetType, Product } from "@/lib/types/database";

type FavItem = {
  id: string;
  target_type: FavoriteTargetType;
  target_id: string;
  product?: Product | null;
  recipe?: {
    id: string;
    title: string;
    slug: string;
    cover_image?: string | null;
    status?: string;
    summary?: string | null;
  } | null;
  video?: {
    id: string;
    title: string;
    slug?: string | null;
    thumbnail_url?: string | null;
    status?: string | null;
    is_active?: boolean;
    summary?: string | null;
  } | null;
};

const TABS: Array<{ key: FavoriteTargetType | "all"; label: string }> = [
  { key: "product", label: "商品" },
  { key: "recipe", label: "食譜" },
  { key: "video", label: "影音" },
];

export default function MemberFavoritesPage() {
  const { addItem } = useCart();
  const [items, setItems] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FavoriteTargetType>("product");
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/member/favorites")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.items ?? d.favorites ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => items.filter((i) => i.target_type === tab), [items, tab]);

  const remove = async (type: FavoriteTargetType, id: string) => {
    await fetch(`/api/member/favorites/${encodeURIComponent(id)}?type=${type}`, { method: "DELETE" });
    load();
  };

  return (
    <RequireAuth>
      <div className="space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.member}><ArrowLeft className="h-5 w-5 text-caramel" /></Link>
          <h1 className="text-xl font-bold text-caramel">我的收藏</h1>
        </div>

        <div className="flex gap-2 rounded-2xl bg-surface p-1 shadow-card">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as FavoriteTargetType)}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm font-semibold transition",
                tab === t.key ? "bg-primary text-white" : "text-foreground-secondary"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[20px] bg-surface" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[20px] bg-error-soft p-6 text-center text-sm text-error">
            {error}
            <button type="button" className="mt-2 block w-full underline" onClick={load}>重試</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[20px] bg-surface py-16 text-center shadow-card">
            <HeartOff className="mx-auto h-12 w-12 text-foreground-secondary" />
            <p className="mt-4 text-foreground-secondary">
              {tab === "product" ? "目前還沒有收藏商品" : tab === "recipe" ? "目前還沒有收藏食譜" : "目前還沒有收藏影音"}
            </p>
            <Link href={tab === "product" ? APP_ROUTES.products : tab === "recipe" ? "/recipes" : "/videos"}>
              <Button className="mt-4 bg-primary">去逛逛</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((fav) => {
              if (fav.target_type === "product") {
                const p = fav.product;
                if (!p) {
                  return (
                    <div key={fav.id} className="rounded-[20px] bg-surface p-4 shadow-card">
                      <p className="text-sm text-foreground-secondary">商品已無法顯示</p>
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => remove("product", fav.target_id)}>
                        取消收藏
                      </Button>
                    </div>
                  );
                }
                const inactive = p.is_active === false || p.status === "inactive";
                const soldOut = (p.stock ?? 0) <= 0 || p.status === "sold_out";
                const unavailable = inactive || soldOut;
                return (
                  <div key={fav.id} className="flex gap-3 rounded-[20px] bg-surface p-4 shadow-card">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-soft">
                      {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${p.id}`} className="line-clamp-2 font-medium text-foreground">
                        {p.name}
                      </Link>
                      <p className="mt-1 font-bold text-primary">{formatCurrency(Number(p.price))}</p>
                      {unavailable && (
                        <p className="text-xs text-error">目前無法購買</p>
                      )}
                      <div className="mt-2 flex gap-2">
                        {!unavailable && (
                          <Button
                            size="sm"
                            className="bg-caramel"
                            onClick={() =>
                              addItem({
                                productId: p.id,
                                name: p.name,
                                price: Number(p.price),
                                imageUrl: p.image_url,
                                quantity: 1,
                              })
                            }
                          >
                            加入購物車
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => remove("product", p.id)}>
                          取消收藏
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }

              if (fav.target_type === "recipe") {
                const r = fav.recipe;
                return (
                  <div key={fav.id} className="rounded-[20px] bg-surface p-4 shadow-card">
                    {r ? (
                      <>
                        <Link href={`/recipes/${r.slug}`} className="font-medium text-foreground">
                          {r.title}
                        </Link>
                        {r.status && r.status !== "published" && (
                          <p className="mt-1 text-xs text-error">此食譜目前無法瀏覽</p>
                        )}
                        {r.summary && (
                          <p className="mt-1 line-clamp-2 text-sm text-foreground-secondary">{r.summary}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-foreground-secondary">食譜已無法顯示</p>
                    )}
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => remove("recipe", fav.target_id)}>
                      取消收藏
                    </Button>
                  </div>
                );
              }

              const v = fav.video;
              return (
                <div key={fav.id} className="rounded-[20px] bg-surface p-4 shadow-card">
                  {v ? (
                    <>
                      <Link href={`/videos/${v.slug || v.id}`} className="font-medium text-foreground">
                        {v.title}
                      </Link>
                      {(v.is_active === false || (v.status && v.status !== "published")) && (
                        <p className="mt-1 text-xs text-error">此影音目前無法播放</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-foreground-secondary">影音已無法顯示</p>
                  )}
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => remove("video", fav.target_id)}>
                    取消收藏
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
