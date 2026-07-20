"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, HeartOff } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/site-links";
import type { Product } from "@/lib/types/database";

type FavoriteRow = {
  id: string;
  product_id: string;
  products: Product | null;
};

export default function MemberFavoritesPage() {
  const { addItem } = useCart();
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/member/favorites")
      .then((r) => r.json())
      .then((d) => setFavorites(d.favorites ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (productId: string) => {
    await fetch(`/api/member/favorites/${productId}`, { method: "DELETE" });
    load();
  };

  return (
    <RequireAuth>
      <div className="space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.member}><ArrowLeft className="h-5 w-5 text-[#173F75]" /></Link>
          <h1 className="text-xl font-bold text-[#173F75]">我的收藏</h1>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-[20px] bg-white" />)}</div>
        ) : favorites.length === 0 ? (
          <div className="rounded-[20px] bg-white py-16 text-center shadow-[0_4px_24px_rgba(23,63,117,0.06)]">
            <HeartOff className="mx-auto h-12 w-12 text-[#6B7280]" />
            <p className="mt-4 text-[#6B7280]">目前還沒有收藏商品</p>
            <Link href={APP_ROUTES.products}><Button className="mt-4 bg-[#E9285C]">去逛逛商品</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav) => {
              const p = fav.products;
              if (!p) return null;
              const inactive = p.is_active === false || p.status === "inactive";
              const soldOut = p.stock <= 0 || p.status === "sold_out";
              return (
                <div key={fav.id} className="flex gap-3 rounded-[20px] bg-white p-4 shadow-[0_4px_24px_rgba(23,63,117,0.06)]">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F7F8FC]">
                    {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${p.id}`} className="font-medium text-[#202124] line-clamp-2">{p.name}</Link>
                    <p className="mt-1 font-bold text-[#E9285C]">{formatCurrency(Number(p.price))}</p>
                    {inactive && <p className="text-xs text-[#DC2626]">商品目前已下架</p>}
                    {!inactive && soldOut && <p className="text-xs text-[#DC2626]">已售完</p>}
                    <div className="mt-2 flex gap-2">
                      {!inactive && !soldOut && (
                        <Button size="sm" className="bg-[#173F75]" onClick={() => addItem({ productId: p.id, name: p.name, price: Number(p.price), imageUrl: p.image_url, quantity: 1 })}>
                          加入購物車
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => remove(p.id)}>取消收藏</Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
