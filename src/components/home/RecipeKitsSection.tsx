"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";

export type RecipeKitCard = {
  id: string;
  name: string;
  cover_image_url: string | null;
  kit_price: number | null;
  button_text: string;
  recipe?: { id: string; title?: string; slug?: string } | null;
  item_count: number;
};

export function RecipeKitsSection({
  title = "一鍵購買材料",
  subtitle,
  viewAllHref = "/recipes",
  limit = 4,
}: {
  title?: string;
  subtitle?: string | null;
  viewAllHref?: string;
  limit?: number;
}) {
  const { addItem } = useCart();
  const [kits, setKits] = useState<RecipeKitCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/home/recipe-kits")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) throw new Error(d.error);
        setKits(((d.kits ?? []) as RecipeKitCard[]).slice(0, limit));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "載入失敗");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit, tick]);

  const addKit = async (kitId: string) => {
    setBusyId(kitId);
    setMessage(null);
    try {
      const res = await fetch(`/api/home/recipe-kits/${kitId}/add-to-cart`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "加入失敗");
      }
      const items = (data.items ?? []) as Array<{
        productId: string;
        name: string;
        price: number;
        imageUrl?: string | null;
        quantity: number;
      }>;
      for (const item of items) {
        await addItem({
          productId: item.productId,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
        });
      }
      const skipped = Number(data.skipped ?? 0);
      setMessage(
        skipped > 0
          ? `已加入 ${items.length} 項（略過 ${skipped} 項缺貨／下架）`
          : `已加入 ${items.length} 項材料`
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "加入失敗");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-3" aria-label={title}>
      <SectionHeader title={title} href={viewAllHref} className="!mb-0" />
      {subtitle ? <p className="text-xs text-foreground-secondary">{subtitle}</p> : null}
      {message ? (
        <p className="rounded-xl bg-primary-soft px-3 py-2 text-xs font-medium text-primary">
          {message}
        </p>
      ) : null}
      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={() => setTick((t) => t + 1)}
        empty={!loading && !error && kits.length === 0}
        emptyTitle="尚無材料包"
        emptyText="後台新增材料包後會顯示在這裡"
        emptyActionHref={viewAllHref}
        emptyActionLabel="逛食譜"
        skeletonCount={3}
      >
        <HorizontalScroller className="md:grid md:grid-cols-2 md:gap-4 md:overflow-visible xl:grid-cols-4">
          {kits.map((kit) => {
            const recipeHref = kit.recipe?.id
              ? `/recipes/${kit.recipe.slug || kit.recipe.id}`
              : viewAllHref;
            return (
              <article
                key={kit.id}
                className="flex w-[200px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-border bg-surface min-[375px]:w-[220px] md:w-auto"
              >
                <Link href={recipeHref} className="relative aspect-[4/3] bg-surface-soft">
                  {kit.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={kit.cover_image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-foreground-secondary">
                      材料包
                    </div>
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <Link href={recipeHref} className="line-clamp-2 text-sm font-bold text-brand-caramel">
                    {kit.name}
                  </Link>
                  <p className="text-[11px] text-foreground-secondary">
                    {kit.item_count} 項材料
                    {kit.kit_price != null ? ` · ${formatCurrency(Number(kit.kit_price))}` : ""}
                  </p>
                  <button
                    type="button"
                    disabled={busyId === kit.id}
                    onClick={() => addKit(kit.id)}
                    className="mt-auto inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-xs font-bold text-white disabled:opacity-60"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
                    {busyId === kit.id ? "加入中…" : kit.button_text || "全部加入購物車"}
                  </button>
                </div>
              </article>
            );
          })}
        </HorizontalScroller>
      </HomeSectionFrame>
    </section>
  );
}
