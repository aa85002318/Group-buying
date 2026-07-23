"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import {
  rankRecipeRecommendations,
  type RankedRecommendation,
} from "@/lib/recipes/recommendations";
import type { RecipeIngredient, RecipeProductRecommendation } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";

type RecipeRecommendationsPanelProps = {
  recommendations: RecipeProductRecommendation[];
  ingredients?: RecipeIngredient[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
};

export function RecipeRecommendationsPanel({
  recommendations,
  ingredients = [],
  title = "AI 商品推薦",
  subtitle = "僅顯示站內可購買的烘焙商品候選，依優先度與老師設定排序。",
  compact,
}: RecipeRecommendationsPanelProps) {
  const { addItem } = useCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const ranked = useMemo(
    () => rankRecipeRecommendations(recommendations),
    [recommendations]
  );

  const fallbackFromIngredients = useMemo(() => {
    if (ranked.length) return [] as RankedRecommendation[];
    return ingredients
      .filter((i) => i.product_id && i.products && i.products.is_active !== false)
      .map((ing, index) => ({
        id: `ing-${ing.id}`,
        recipe_id: ing.recipe_id,
        step_id: null,
        ingredient_id: ing.id,
        product_id: ing.product_id!,
        recommendation_type: "ingredient" as const,
        recommendation_reason: `本食譜材料「${ing.name}」對應商品`,
        priority: 0,
        manual_override: false,
        is_active: true,
        created_at: "",
        updated_at: "",
        products: ing.products,
        score: 10 - index,
        displayReason: `本食譜材料「${ing.name}」對應商品`,
      }));
  }, [ranked.length, ingredients]);

  const list = ranked.length ? ranked : fallbackFromIngredients;

  const addOne = async (row: RankedRecommendation) => {
    if (!row.products) return;
    setBusyId(row.id);
    setMsg(null);
    try {
      const price = Number(row.products.sale_price ?? row.products.price ?? 0);
      await addItem({
        productId: row.product_id,
        name: row.products.name,
        price,
        imageUrl: row.products.image_url,
        quantity: 1,
      });
      setMsg(`已加入「${row.products.name}」`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "無法加入購物車");
    } finally {
      setBusyId(null);
    }
  };

  const addAll = async () => {
    setMsg(null);
    let ok = 0;
    for (const row of list) {
      if (!row.products) continue;
      try {
        await addItem({
          productId: row.product_id,
          name: row.products.name,
          price: Number(row.products.sale_price ?? row.products.price ?? 0),
          imageUrl: row.products.image_url,
          quantity: 1,
        });
        ok += 1;
      } catch {
        /* skip unavailable */
      }
    }
    setMsg(ok ? `已加入 ${ok} 項推薦商品` : "沒有可加入的商品");
  };

  if (!list.length) {
    return (
      <section className="space-y-2">
        <h2 className="text-xl font-bold text-[#6B3F24]">{title}</h2>
        <p className="text-sm text-foreground-secondary">目前沒有可購買的推薦商品。</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className={compact ? "text-base font-bold text-[#6B3F24]" : "text-xl font-bold text-[#6B3F24]"}>
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-sm text-foreground-secondary">{subtitle}</p> : null}
      </div>

      <ul className="space-y-3">
        {list.map((r) => {
          const p = r.products;
          const price = Number(p?.sale_price ?? p?.price ?? 0);
          return (
            <li
              key={r.id}
              className="flex gap-3 rounded-2xl border border-[#F2D8BF] bg-white p-3"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#FFF9EA]">
                {p?.image_url ? (
                  <Image src={p.image_url} alt="" fill className="object-cover" sizes="80px" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#FF8A3D]">
                  {typeLabel(r.recommendation_type)}
                  {r.manual_override ? " · 老師指定" : ""}
                </p>
                <p className="font-semibold text-[#6B3F24]">{p?.name ?? "商品"}</p>
                <p className="mt-0.5 text-xs text-foreground-secondary line-clamp-2">
                  {r.displayReason}
                </p>
                <p className="mt-1 text-sm font-bold text-[#FF5A5F]">{formatCurrency(price)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={`/products/${r.product_id}`}
                    className="text-xs font-medium text-[#6B3F24] underline-offset-2 hover:underline"
                  >
                    查看商品
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => addOne(r)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#FF5A5F] px-3 py-1 text-xs font-bold text-white disabled:opacity-60"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    加入購物車
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={addAll}
        className="min-h-11 w-full rounded-2xl border border-[#F2D8BF] bg-[#FFF9EA] text-sm font-bold text-[#6B3F24]"
      >
        全部加入購物車
      </button>
      {msg ? <p className="text-xs text-foreground-secondary">{msg}</p> : null}
    </section>
  );
}

function typeLabel(type: string): string {
  switch (type) {
    case "substitute":
      return "替代材料";
    case "tool":
      return "器具";
    case "teacher_choice":
      return "老師推薦";
    case "packaging":
      return "包裝";
    case "decoration":
      return "裝飾";
    case "upgrade":
      return "升級";
    default:
      return "材料";
  }
}
