"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getMockGroupBuyEventsWithProducts } from "@/lib/mock-data";
import { recordBrowse } from "@/lib/home/browse-history";
import {
  computeGroupBuyRuntimeStatus,
  formatCountdown,
  formatPriceTwd,
  fulfillmentShortLabels,
  DEFAULT_GROUP_BUY_PAGE_SETTINGS,
} from "@/lib/group-buy/page-settings";
import type { GroupBuyEvent, Product } from "@/lib/types/database";

type GroupBuyEventDetail = GroupBuyEvent & {
  group_buy_products?: Array<{
    id?: string;
    special_price?: number | null;
    max_quantity?: number | null;
    sold_count?: number | null;
    products?: Product | null;
  }>;
};

const STATUS_LABEL: Record<string, string> = {
  active: "進行中",
  ending_soon: "即將結團",
  upcoming: "即將開團",
  ended: "已結團",
  sold_out: "已售罄",
  draft: "草稿",
  cancelled: "已取消",
};

export default function GroupBuyDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<GroupBuyEventDetail | null>(null);
  const [endingSoonHours, setEndingSoonHours] = useState(
    DEFAULT_GROUP_BUY_PAGE_SETTINGS.endingSoonHours
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/group-buy/page-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.endingSoonHours) setEndingSoonHours(d.settings.endingSoonHours);
      })
      .catch(() => {});

    fetch(`/api/group-buy-events/${params.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setEvent(d.event);
        if (d.event) {
          recordBrowse({
            type: "group_buy",
            id: d.event.id,
            title: d.event.title,
            imageUrl: d.event.banner_url,
            href: `/group-buy/${d.event.id}`,
            endAt: d.event.end_at,
          });
        }
      })
      .catch(() => {
        const fallback = getMockGroupBuyEventsWithProducts().find((e) => e.id === params.id);
        setEvent(fallback ?? null);
        if (fallback) {
          recordBrowse({
            type: "group_buy",
            id: fallback.id,
            title: fallback.title,
            imageUrl: fallback.banner_url,
            href: `/group-buy/${fallback.id}`,
            endAt: fallback.end_at,
          });
        }
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

  const runtime = computeGroupBuyRuntimeStatus({
    status: event.status,
    start_at: event.start_at,
    end_at: event.end_at,
    endingSoonHours,
  });
  const canBuy = runtime === "active" || runtime === "ending_soon";
  const fulfillment = fulfillmentShortLabels(event.fulfillment_options);
  const groupPrice = Number(event.group_price ?? 0);
  const originalPrice = Number(event.original_price ?? 0);

  const products =
    event.group_buy_products
      ?.map((gbp) => {
        const product = gbp.products;
        if (!product) return null;
        const soldOut =
          gbp.max_quantity != null &&
          Number(gbp.sold_count ?? 0) >= Number(gbp.max_quantity);
        return {
          ...product,
          price: gbp.special_price ?? event.group_price ?? product.price,
          original_price: event.original_price ?? product.original_price,
          _soldOut: soldOut,
          _groupBuyProductId: gbp.id ?? null,
        };
      })
      .filter(Boolean) ?? [];

  const virtualSold = Number(event.virtual_sold_qty ?? 0);
  const showVirtual =
    event.show_virtual_sales_label !== false && virtualSold > 0;
  const realSoldFallback = (event.group_buy_products ?? []).reduce(
    (s, p) => s + Number(p.sold_count ?? 0),
    0
  );

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
          <Badge variant={canBuy ? "success" : "secondary"}>
            {STATUS_LABEL[runtime] ?? runtime}
          </Badge>
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}
        <p className="text-xs text-coffee">
          {formatDate(event.start_at)} — {formatDate(event.end_at)}
        </p>
        {(runtime === "active" || runtime === "ending_soon") && (
          <p className="text-sm font-semibold text-groupBuy">
            倒數 {formatCountdown(event.end_at)}
          </p>
        )}
        {runtime === "upcoming" && (
          <p className="text-sm font-semibold text-foreground-secondary">
            開團倒數 {formatCountdown(event.start_at)}
          </p>
        )}
        {groupPrice > 0 && (
          <p className="text-lg font-black text-groupBuy">
            {formatPriceTwd(groupPrice)}
            {originalPrice > groupPrice && (
              <span className="ml-2 text-sm font-normal text-foreground-muted line-through">
                {formatPriceTwd(originalPrice)}
              </span>
            )}
          </p>
        )}
        {fulfillment.length > 0 && (
          <p className="text-sm text-foreground-secondary">取貨：{fulfillment.join(" · ")}</p>
        )}
        {(realSoldFallback > 0 || showVirtual) && (
          <p className="text-sm text-foreground-secondary">
            已售 {realSoldFallback + virtualSold} 件
            {showVirtual ? (
              <span className="ml-1 text-foreground-muted">（含虛擬 {virtualSold}）</span>
            ) : null}
          </p>
        )}
        {event.max_qty_per_user != null && (
          <p className="text-sm text-foreground-secondary">
            每人限購 {event.max_qty_per_user} 件（跨訂單累計）
          </p>
        )}
        {!canBuy && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {runtime === "upcoming"
              ? "尚未開團，可查看詳情但無法加入購物車。"
              : "此團購目前無法購買。"}
          </p>
        )}
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
                groupBuyEventId={event.id}
                groupBuyProductId={product!._groupBuyProductId}
                badge={product!._soldOut || !canBuy ? "soldout" : "groupBuy"}
                showQuickAdd={canBuy && !product!._soldOut}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
