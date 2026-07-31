"use client";

import { memo } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { APP_ROUTES } from "@/lib/site-links";

/** Hero cart — reuses useCart (no second cart store). */
export const CartButton = memo(function CartButton({
  className,
}: {
  className?: string;
}) {
  const { itemCount } = useCart();
  const label =
    itemCount > 0
      ? `購物車，共 ${itemCount > 99 ? "99+" : itemCount} 件商品`
      : "開啟購物車";

  return (
    <Link href={APP_ROUTES.cart} className={className} aria-label={label}>
      <ShoppingCart className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
      {itemCount > 0 ? (
        <span className="hero-action-badge hero-action-badge--count" aria-hidden>
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
});
