"use client";

import type { Product } from "@/lib/types/database";
import { ShopHomeProductRail } from "@/components/shop/ShopHomeProductRail";
import type { ShopRailBadge } from "@/components/shop/ShopProductRailCard";

function badgeFor(p: Product): ShopRailBadge | null {
  if (p.status === "sold_out" || (Number(p.stock ?? 0) <= 0 && !p.allow_oversell)) {
    return "soldout";
  }
  return "sale";
}

export function ShopSaleProducts({
  title = "優惠商品",
  limit = 10,
}: {
  title?: string;
  limit?: number;
}) {
  return (
    <ShopHomeProductRail
      className="shop-sale-products"
      title={title}
      href="/shop/sale"
      apiUrl={`/api/shop/sale-products?limit=${limit}`}
      badgeFor={badgeFor}
    />
  );
}
