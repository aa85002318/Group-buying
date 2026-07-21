"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import { useCart } from "@/hooks/useCart";
import type { ReorderCandidate } from "@/lib/home/reorder";
import { formatCurrency, cn } from "@/lib/utils";

function ReorderCard({
  productId,
  name,
  price,
  imageUrl,
  unit,
}: {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  unit?: string | null;
}) {
  const { addItem, items, updateQuantity } = useCart();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const inCart = items.find((i) => i.productId === productId && !i.groupBuyProductId);

  const add = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await addItem({
        productId,
        name,
        price,
        imageUrl,
        quantity: qty,
      });
      setMsg("已加入購物車");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "加入失敗");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 2000);
    }
  };

  return (
    <article className="card-lift flex w-[168px] shrink-0 flex-col overflow-hidden rounded-[18px] border border-border-soft bg-surface md:w-auto">
      <div className="relative aspect-square bg-surface-soft">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-foreground-muted">
            暫無圖片
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-surface-yellow px-2 py-0.5 text-[10px] font-bold text-brand-caramel">
          再次購買
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-brand-caramel">{name}</p>
        {unit ? <p className="text-xs text-foreground-secondary">{unit}</p> : null}
        <p className="text-sm font-bold text-brand-primary">{formatCurrency(price)}</p>
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between rounded-button bg-surface-peach px-1">
            <button
              type="button"
              aria-label="減少數量"
              className="flex h-9 w-9 items-center justify-center text-brand-caramel"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-bold text-brand-caramel">
              {qty}
            </span>
            <button
              type="button"
              aria-label="增加數量"
              className="flex h-9 w-9 items-center justify-center text-brand-caramel"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={add}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-button bg-brand-primary text-sm font-bold text-white transition duration-200 hover:bg-primary-hover disabled:opacity-60"
          >
            <ShoppingCart className="h-4 w-4" />
            加入購物車
          </button>
          {inCart ? (
            <button
              type="button"
              className="text-xs font-medium text-foreground-secondary underline-offset-2 hover:underline"
              onClick={() => updateQuantity(productId, inCart.quantity + 1)}
            >
              購物車已有 {inCart.quantity} 件
            </button>
          ) : null}
          {msg ? <p className="text-center text-xs text-foreground-secondary">{msg}</p> : null}
        </div>
      </div>
    </article>
  );
}

type QuickReorderSectionProps = {
  candidates: ReorderCandidate[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

/** 快速回購 — 僅會員且有 App 訂單候選時顯示（由 page 控制掛載） */
export function QuickReorderSection({
  candidates,
  loading,
  error,
  onRetry,
}: QuickReorderSectionProps) {
  return (
    <section className="space-y-3 bg-surface">
      <div>
        <SectionHeader
          title={
            <span className="inline-flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-brand-primary" aria-hidden />
              再次購買
            </span>
          }
          href="/orders"
          linkLabel="訂單紀錄"
        />
        <p className="-mt-2 text-sm text-foreground-secondary">
          常買商品，一鍵加入購物車
        </p>
      </div>
      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!loading && !error && candidates.length === 0}
        emptyTitle="還沒有可回購的商品"
        emptyText="完成第一筆 App 訂單後，常買商品會出現在這裡。"
        emptyActionHref="/products"
        emptyActionLabel="去逛逛商品"
      >
        <div
          className={cn(
            "flex gap-3 overflow-x-auto pb-1 scrollbar-none",
            "md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible"
          )}
        >
          {candidates.map((c) => (
            <ReorderCard
              key={c.productId}
              productId={c.productId}
              name={c.name}
              price={c.price}
              imageUrl={c.imageUrl}
              unit={c.unit}
            />
          ))}
        </div>
      </HomeSectionFrame>
    </section>
  );
}
