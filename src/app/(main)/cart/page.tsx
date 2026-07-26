"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { EmailVerificationNotice } from "@/components/auth/EmailVerificationNotice";
import { useCart } from "@/hooks/useCart";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import {
  buildTemperatureSplitNotice,
  collectTemperatureZones,
  type ProductTemperatureFlags,
} from "@/lib/checkout/temperature-zones";

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, itemCount, clear } = useCart();
  const { loading, loggedIn, email, emailVerified, resending, resendVerification, canPurchase } =
    useEmailVerification();
  const [tempNotice, setTempNotice] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      setTempNotice(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const rows: ProductTemperatureFlags[] = [];
      await Promise.all(
        items.map(async (item) => {
          try {
            const res = await fetch(`/api/products/${item.productId}`);
            const data = await res.json();
            if (data.product) rows.push(data.product as ProductTemperatureFlags);
          } catch {
            /* ignore */
          }
        })
      );
      if (!cancelled) {
        setTempNotice(buildTemperatureSplitNotice(collectTemperatureZones(rows)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

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

      {tempNotice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p className="font-medium">溫層提醒</p>
          <p className="mt-0.5 text-amber-900/90">{tempNotice}</p>
        </div>
      )}

      {items.map((item) => (
        <CartItem
          key={`${item.productId}-${item.groupBuyProductId ?? ""}`}
          item={item}
          onUpdateQuantity={updateQuantity}
          onRemove={removeItem}
        />
      ))}

      {!loading && loggedIn && emailVerified === false && (
        <EmailVerificationNotice
          email={email}
          resending={resending}
          onResend={async () => {
            try {
              const message = await resendVerification();
              alert(message);
            } catch (e) {
              alert(e instanceof Error ? e.message : "寄送失敗");
            }
          }}
        />
      )}

      <CartSummary
        total={total}
        itemCount={itemCount}
        onClear={clear}
        canCheckout={!loggedIn || canPurchase}
        checkoutBlockedReason="請先完成 Email 驗證"
      />
    </div>
  );
}
