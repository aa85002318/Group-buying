"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

type Product = {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
};

export function RecommendHomeSection() {
  const [forYou, setForYou] = useState<Product[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/recommendations?type=for_you").then((r) => r.json()),
      fetch("/api/recommendations?type=recent").then((r) => r.json()),
    ])
      .then(([a, b]) => {
        setForYou(a.products ?? []);
        setRecent(b.products ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-40 shrink-0 rounded-[20px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {recent.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-7 w-1.5 rounded-full bg-[#757575]" />
              <h2 className="section-title">最近看過</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {recent.map((p) => (
              <div key={p.id} className="w-[42%] shrink-0 sm:w-[28%]">
                <ProductCard
                  id={p.id}
                  name={p.name}
                  price={Number(p.price)}
                  original_price={p.original_price}
                  image_url={p.image_url}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {forYou.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-7 w-1.5 rounded-full bg-primary" />
              <h2 className="section-title">猜你喜歡</h2>
            </div>
            <Link href="/products" className="text-sm font-bold text-primary">
              查看更多
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {forYou.map((p) => (
              <div key={p.id} className="w-[42%] shrink-0 sm:w-[28%]">
                <ProductCard
                  id={p.id}
                  name={p.name}
                  price={Number(p.price)}
                  original_price={p.original_price}
                  image_url={p.image_url}
                  sticker="hot"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
