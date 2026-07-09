"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface CartSummaryProps {
  total: number;
  itemCount: number;
  onClear: () => void;
  canCheckout?: boolean;
  checkoutBlockedReason?: string;
}

export function CartSummary({
  total,
  itemCount,
  onClear,
  canCheckout = true,
  checkoutBlockedReason,
}: CartSummaryProps) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-card space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>商品小計（{itemCount} 件）</span>
        <span>{formatCurrency(total)}</span>
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>運費</span>
        <span>結帳時計算</span>
      </div>
      <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
        <span>預估合計</span>
        <span className="text-promo">{formatCurrency(total)}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" onClick={onClear}>
          清空購物車
        </Button>
        {canCheckout ? (
          <Link href="/checkout" className="flex-1">
            <Button className="w-full" variant="promo">
              前往結帳
            </Button>
          </Link>
        ) : (
          <Button className="flex-1" variant="promo" disabled title={checkoutBlockedReason}>
            請先驗證 Email
          </Button>
        )}
      </div>
    </div>
  );
}
