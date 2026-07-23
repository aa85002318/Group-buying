"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { RECIPE_SCALE_PRESETS, scaleAmountText } from "@/lib/recipes/scaling";
import type { RecipeIngredient } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type IngredientChecklistProps = {
  ingredients: RecipeIngredient[];
  multiplier: number;
  onMultiplierChange: (value: number) => void;
  haveIds: Set<string>;
  onToggleHave: (id: string) => void;
  scalingEnabled?: boolean;
  showScaleControls?: boolean;
  cookMode?: boolean;
};

export function IngredientChecklist({
  ingredients,
  multiplier,
  onMultiplierChange,
  haveIds,
  onToggleHave,
  scalingEnabled = true,
  showScaleControls = true,
  cookMode,
}: IngredientChecklistProps) {
  const { addItem } = useCart();
  const [custom, setCustom] = useState(String(multiplier));
  const [cartMsg, setCartMsg] = useState<string | null>(null);
  const [cartBusy, setCartBusy] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, RecipeIngredient[]>();
    for (const ing of ingredients) {
      const key = ing.group_name?.trim() || "材料";
      const list = map.get(key) ?? [];
      list.push(ing);
      map.set(key, list);
    }
    return map;
  }, [ingredients]);

  const missing = ingredients.filter((i) => !haveIds.has(i.id) && i.product_id);

  const addProducts = async (list: RecipeIngredient[]) => {
    setCartBusy(true);
    setCartMsg(null);
    let ok = 0;
    let fail = 0;
    for (const ing of list) {
      if (!ing.product_id) continue;
      try {
        await addItem({
          productId: ing.product_id,
          name: ing.products?.name || ing.name,
          price: Number(ing.products?.sale_price ?? ing.products?.price ?? 0),
          imageUrl: ing.products?.image_url,
          quantity: 1,
        });
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setCartBusy(false);
    if (ok && !fail) setCartMsg(`已加入 ${ok} 項商品到購物車`);
    else if (ok && fail) setCartMsg(`已加入 ${ok} 項，${fail} 項無法加入`);
    else setCartMsg("沒有可加入的商品（需已關聯商品）");
  };

  if (!ingredients.length) {
    return <p className="text-sm text-foreground-secondary">尚無材料清單</p>;
  }

  return (
    <div className="space-y-4">
      {scalingEnabled && showScaleControls ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#6B3F24]">配方倍率</p>
          <div className="flex flex-wrap gap-2">
            {RECIPE_SCALE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onMultiplierChange(p);
                  setCustom(String(p));
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-semibold",
                  multiplier === p
                    ? "border-[#FF5A5F] bg-[#FF5A5F] text-white"
                    : "border-[#F2D8BF] bg-white text-[#6B3F24]"
                )}
              >
                {p} 倍
              </button>
            ))}
            <label className="inline-flex items-center gap-1 rounded-full border border-[#F2D8BF] bg-white px-3 py-1.5 text-sm text-[#6B3F24]">
              自訂
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onBlur={() => {
                  const n = Number(custom);
                  if (Number.isFinite(n) && n > 0) onMultiplierChange(n);
                }}
                className="w-14 bg-transparent outline-none"
              />
            </label>
          </div>
          {multiplier !== 1 ? (
            <p className="text-xs text-foreground-secondary">
              目前 {multiplier} 倍（原始數值不會被修改）
            </p>
          ) : null}
        </div>
      ) : null}

      {Array.from(groups.entries()).map(([group, items]) => (
        <div key={group}>
          <h3 className={cn("mb-2 font-semibold text-[#6B3F24]", cookMode ? "text-base" : "text-sm")}>
            {group}
          </h3>
          <ul className="divide-y divide-[#F2D8BF] overflow-hidden rounded-[16px] border border-[#F2D8BF] bg-white">
            {items.map((ing) => {
              const have = haveIds.has(ing.id);
              const scaled = scaleAmountText(ing.amount, multiplier, ing.quantity_numeric);
              return (
                <li key={ing.id} className={cn("px-4 py-3", cookMode && "py-4")}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={have}
                      onChange={() => onToggleHave(ing.id)}
                      className="mt-1 h-5 w-5 rounded border-[#F2D8BF] text-[#FF5A5F]"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "flex items-center justify-between gap-3",
                          cookMode ? "text-base" : "text-sm"
                        )}
                      >
                        <span className={cn("font-medium text-[#6B3F24]", have && "line-through opacity-60")}>
                          {ing.name}
                        </span>
                        <span className="shrink-0 text-foreground-secondary">
                          {[scaled, ing.unit].filter(Boolean).join(" ") || "—"}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-foreground-secondary">
                        {have ? "☑ 我已經有" : "☐ 我還缺"}
                        {ing.substitution_notes ? ` · 可替代：${ing.substitution_notes}` : ""}
                      </span>
                      {ing.product_id ? (
                        <Link
                          href={`/products/${ing.product_id}`}
                          className="mt-1 inline-block text-xs font-medium text-[#FF5A5F] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          查看推薦商品 →
                        </Link>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={cartBusy}
          onClick={() => addProducts(ingredients.filter((i) => i.product_id))}
          className="min-h-11 flex-1 rounded-2xl bg-[#FF5A5F] px-4 text-sm font-bold text-white disabled:opacity-60"
        >
          全部加入購物車
        </button>
        <button
          type="button"
          disabled={cartBusy || missing.length === 0}
          onClick={() => addProducts(missing)}
          className="min-h-11 flex-1 rounded-2xl border border-[#F2D8BF] bg-white px-4 text-sm font-bold text-[#6B3F24] disabled:opacity-50"
        >
          只加入缺少的材料
        </button>
      </div>
      {cartMsg ? <p className="text-xs text-foreground-secondary">{cartMsg}</p> : null}
    </div>
  );
}
