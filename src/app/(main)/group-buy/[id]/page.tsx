"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getMockGroupBuyEventsWithProducts } from "@/lib/mock-data";
import type { GroupBuyEvent, Product } from "@/lib/types/database";

type GroupBuyEventDetail = GroupBuyEvent & {
  group_buy_products?: Array<{
    special_price?: number | null;
    products?: Product | null;
  }>;
};

export default function GroupBuyDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<GroupBuyEventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/group-buy-events/${params.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setEvent(d.event))
      .catch(() => {
        const fallback = getMockGroupBuyEventsWithProducts().find((e) => e.id === params.id);
        setEvent(fallback ?? null);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <p className="py-12 text-center text-muted-foreground">載入中...</p>;
  }

  if (!event) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">找不到此團購活動</p>
        <Link href="/group-buy" className="text-sm text-primary hover:underline">
          返回團購專區
        </Link>
      </div>
    );
  }

  const products =
    event.group_buy_products
      ?.map((gbp) => {
        const product = gbp.products;
        if (!product) return null;
        return {
          ...product,
          price: gbp.special_price ?? product.price,
        };
      })
      .filter(Boolean) ?? [];

  return (
    <div className="space-y-4">
      <Link href="/group-buy" className="text-sm text-primary hover:underline">
        ← 返回團購專區
      </Link>

      {event.banner_url && (
        <div className="relative -mx-4 aspect-video overflow-hidden bg-muted">
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
            priority
            unoptimized
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-coffee">{event.title}</h1>
          <Badge variant="success">進行中</Badge>
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}
        <p className="text-xs text-coffee">
          {formatDate(event.start_at)} — {formatDate(event.end_at)}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-coffee">團購商品</h2>
        {products.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">此活動尚無商品</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product!.id}
                id={product!.id}
                name={product!.name}
                price={product!.price}
                original_price={product!.original_price}
                image_url={product!.image_url}
                groupBuyLabel="團購價"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
