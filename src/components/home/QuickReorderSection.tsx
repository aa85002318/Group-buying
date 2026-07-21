"use client";

import { useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { useCart } from "@/hooks/useCart";
import type { ReorderCandidate } from "@/lib/home/reorder";
import { formatCurrency } from "@/lib/utils";

function ReorderCard({
  productId,
  name,
  price,
  imageUrl,
}: {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
}) {
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await addItem({ productId, name, price, imageUrl, quantity: 1 });
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="flex w-[120px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-border-soft bg-surface min-[375px]:w-[132px] sm:w-[140px] md:w-auto">
      <div className="relative aspect-square bg-surface-soft">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-foreground-muted">
            暫無圖片
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 rounded-full bg-surface-yellow px-1.5 py-0.5 text-[10px] font-bold text-brand-caramel">
          再買
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <p className="line-clamp-2 min-h-[2rem] text-[12px] font-semibold leading-snug text-brand-caramel">
          {name}
        </p>
        <div className="mt-auto flex items-center justify-between gap-1">
          <p className="text-[12px] font-bold text-brand-primary">{formatCurrency(price)}</p>
          <button
            type="button"
            disabled={busy}
            onClick={add}
            aria-label="加入購物車"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
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

/** 精簡回購卡：一次約 3.2 張；僅會員且有資料時由 page 掛載 */
export function QuickReorderSection({
  candidates,
  loading,
  error,
  onRetry,
}: QuickReorderSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <SectionHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4 text-brand-primary" aria-hidden />
              再次購買
            </span>
          }
          href="/orders"
          linkLabel="更多"
          className="!mb-0"
        />
        <p className="mt-1 text-xs text-foreground-secondary">常買商品，一鍵加入購物車</p>
      </div>
      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!loading && !error && candidates.length === 0}
        emptyTitle="還沒有可回購的商品"
        emptyText="完成 App 訂單後會出現在這裡"
        emptyActionHref="/products"
        emptyActionLabel="去逛逛"
        skeletonCount={3}
      >
        <HorizontalScroller className="md:grid md:grid-cols-4 md:gap-4 md:overflow-visible lg:grid-cols-6">
          {candidates.map((c) => (
            <ReorderCard
              key={c.productId}
              productId={c.productId}
              name={c.name}
              price={c.price}
              imageUrl={c.imageUrl}
            />
          ))}
        </HorizontalScroller>
      </HomeSectionFrame>
    </section>
  );
}
