"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import type { RecipeIngredient } from "@/lib/types/database";

type MissingIngredientsCartButtonProps = {
  ingredients: RecipeIngredient[];
  haveIds: Set<string>;
  label?: string;
  className?: string;
};

/** One-tap add missing linked products to cart (finish / recommendations pages). */
export function MissingIngredientsCartButton({
  ingredients,
  haveIds,
  label = "一鍵加入缺少材料",
  className,
}: MissingIngredientsCartButtonProps) {
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const missing = ingredients.filter((i) => !haveIds.has(i.id) && i.product_id);

  const onClick = async () => {
    setBusy(true);
    setMsg(null);
    let ok = 0;
    let fail = 0;
    for (const ing of missing) {
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
    setBusy(false);
    if (ok && !fail) setMsg(`已加入 ${ok} 項缺少材料`);
    else if (ok) setMsg(`已加入 ${ok} 項，${fail} 項無法加入`);
    else setMsg(missing.length ? "沒有可加入的商品（可能已售完）" : "目前沒有缺少的關聯材料");
  };

  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy || missing.length === 0}
        onClick={onClick}
        className="min-h-11 w-full rounded-2xl bg-[#FF5A5F] px-4 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "加入中…" : `${label}${missing.length ? `（${missing.length}）` : ""}`}
      </button>
      {msg ? (
        <p className="mt-2 text-center text-xs text-foreground-secondary">
          {msg}
          {msg.includes("已加入") ? (
            <>
              {" "}
              <Link href="/cart" className="font-medium text-[#FF5A5F] underline">
                前往購物車
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
