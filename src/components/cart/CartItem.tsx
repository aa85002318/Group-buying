"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { CartLine } from "@/hooks/useCart";

interface CartItemProps {
  item: CartLine;
  onUpdateQuantity: (productId: string, quantity: number, groupBuyProductId?: string | null) => void;
  onRemove: (productId: string, groupBuyProductId?: string | null) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <Card>
      <CardContent className="flex gap-3 p-3">
        <Link
          href={`/products/${item.productId}`}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
        >
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">無圖</div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/products/${item.productId}`} className="line-clamp-2 font-medium hover:text-primary">
            {item.name}
          </Link>
          <p className="mt-1 text-promo">{formatCurrency(item.price)}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border"
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1, item.groupBuyProductId)}
            >
              −
            </button>
            <span className="w-6 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border"
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.groupBuyProductId)}
            >
              +
            </button>
            <button
              type="button"
              className="ml-auto text-xs text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(item.productId, item.groupBuyProductId)}
            >
              移除
            </button>
          </div>
        </div>
        <p className="shrink-0 font-bold text-promo">{formatCurrency(item.price * item.quantity)}</p>
      </CardContent>
    </Card>
  );
}
