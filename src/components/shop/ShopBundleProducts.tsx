"use client";

import type { Product } from "@/lib/types/database";
import { ShopHomeProductRail } from "@/components/shop/ShopHomeProductRail";
import type { ShopRailBadge } from "@/components/shop/ShopProductRailCard";

function badgeFor(p: Product): ShopRailBadge | null {
  if (p.status === "sold_out" || (Number(p.stock ?? 0) <= 0 && !p.allow_oversell)) {
    return "soldout";
  }
  return "bundle";
}

export function ShopBundleProducts({
  title = "組合優惠",
  limit = 10,
}: {
  title?: string;
  limit?: number;
}) {
  return (
    <ShopHomeProductRail
      className="shop-bundle-products"
      title={title}
      href="/group-buy"
      apiUrl={`/api/shop/bundle-products?limit=${limit}`}
      badgeFor={badgeFor}
    />
  );
}
