"use client";

import Link from "next/link";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart } from "@/hooks/useCart";

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, itemCount, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">購物車是空的</p>
        <Link href="/products" className="inline-block text-primary hover:underline">
          前往選購商品
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-coffee">購物車</h1>
        <span className="text-sm text-muted-foreground">共 {itemCount} 件</span>
      </div>

      {items.map((item) => (
        <CartItem
          key={`${item.productId}-${item.groupBuyProductId ?? ""}`}
          item={item}
          onUpdateQuantity={updateQuantity}
          onRemove={removeItem}
        />
      ))}

      <CartSummary total={total} itemCount={itemCount} onClear={clear} />
    </div>
  );
}
