"use client";

import Link from "next/link";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { EmailVerificationNotice } from "@/components/auth/EmailVerificationNotice";
import { useCart } from "@/hooks/useCart";
import { useEmailVerification } from "@/hooks/useEmailVerification";

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, itemCount, clear } = useCart();
  const { loading, loggedIn, email, emailVerified, resending, resendVerification, canPurchase } =
    useEmailVerification();

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
