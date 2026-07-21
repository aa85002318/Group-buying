"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import { useCart } from "@/hooks/useCart";
import type { ReorderCandidate } from "@/lib/home/reorder";
import { formatCurrency, cn } from "@/lib/utils";
import type { Product } from "@/lib/types/database";

type Mode = "reorder" | "suggest";

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
    <article className="flex w-[168px] shrink-0 flex-col overflow-hidden rounded-[18px] border border-border-soft bg-surface shadow-card md:w-auto">
      <div className="relative aspect-square bg-surface-soft">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-foreground-muted">
            暫無圖片
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-foreground">{name}</p>
        {unit ? <p className="text-xs text-foreground-secondary">{unit}</p> : null}
        <p className="text-sm font-bold text-caramel">{formatCurrency(price)}</p>
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between rounded-button border border-border-soft bg-surface-soft px-1">
            <button
              type="button"
              aria-label="減少數量"
              className="flex h-9 w-9 items-center justify-center text-caramel"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-bold">{qty}</span>
            <button
              type="button"
              aria-label="增加數量"
              className="flex h-9 w-9 items-center justify-center text-caramel"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={add}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-button bg-primary text-sm font-bold text-white disabled:opacity-60"
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
  mode: Mode;
  candidates: ReorderCandidate[];
  suggestProducts: Product[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function QuickReorderSection({
  mode,
  candidates,
  suggestProducts,
  loading,
  error,
  onRetry,
}: QuickReorderSectionProps) {
  const isReorder = mode === "reorder" && candidates.length > 0;
  const title = isReorder ? "再次購買" : "猜你喜歡";
  const subtitle = isReorder
    ? "常買商品，一鍵快速加入購物車。"
    : "還沒有購買紀錄？從熱門與新品開始挑。";

  const cards = isReorder
    ? candidates.map((c) => ({
        key: c.productId,
        productId: c.productId,
        name: c.name,
        price: c.price,
        imageUrl: c.imageUrl,
        unit: c.unit,
      }))
    : suggestProducts.slice(0, 6).map((p) => ({
        key: p.id,
        productId: p.id,
        name: p.name,
        price: Number(p.price),
        imageUrl: p.image_url,
        unit: p.unit ?? p.subtitle ?? null,
      }));

  return (
    <section className="space-y-3">
      <div>
        <SectionHeader title={title} href="/products" linkLabel="逛更多" />
        <p className="-mt-2 text-sm text-foreground-secondary">{subtitle}</p>
      </div>
      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!loading && !error && cards.length === 0}
        emptyText="還沒有購買紀錄。立即開始第一筆訂單！"
      >
        <div
          className={cn(
            "flex gap-3 overflow-x-auto pb-1 scrollbar-none",
            "md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible"
          )}
        >
          {cards.map((c) => (
            <ReorderCard
              key={c.key}
              productId={c.productId}
              name={c.name}
              price={c.price}
              imageUrl={c.imageUrl}
              unit={c.unit}
            />
          ))}
        </div>
        {!isReorder && cards.length === 0 ? (
          <p className="text-center">
            <Link href="/products" className="text-sm font-semibold text-primary">
              立即開始第一筆訂單
            </Link>
          </p>
        ) : null}
      </HomeSectionFrame>
    </section>
  );
}
