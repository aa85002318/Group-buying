"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PRODUCT_BLOCK,
  PRODUCT_BLOCK_SORT_LABELS,
  PRODUCT_BLOCK_SOURCE_LABELS,
  expandCategoryIds,
  pickProductsForBlock,
  productBlockEmptyText,
  type ProductBlockSettings,
  type ProductBlockSort,
  type ProductBlockSource,
} from "@/lib/home/product-block";
import type { Product } from "@/lib/types/database";

type Category = {
  id: string;
  name: string;
  slug?: string | null;
  parent_id?: string | null;
  sort_order?: number | null;
};

/** 商品展示區域：來源、分類、排序與顯示設定。 */
export function ProductBlockEditor({
  value,
  onChange,
  readOnly,
  manualIds,
}: {
  value: ProductBlockSettings;
  onChange: (next: ProductBlockSettings) => void;
  readOnly?: boolean;
  manualIds: string[];
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let dead = false;
    Promise.all([
      fetch("/api/categories").then((r) => r.json()).catch(() => ({})),
      fetch("/api/products").then((r) => r.json()).catch(() => ({})),
    ]).then(([cats, prods]) => {
      if (dead) return;
      setCategories(((cats?.categories ?? []) as Category[]) ?? []);
      setProducts(((prods?.products ?? []) as Product[]) ?? []);
      setLoading(false);
    });
    return () => {
      dead = true;
    };
  }, []);

  const set = (patch: Partial<ProductBlockSettings>) => onChange({ ...value, ...patch });

  /** 分類排成父→子的順序，方便階層勾選。 */
  const tree = useMemo(() => {
    const byParent = new Map<string, Category[]>();
    for (const c of categories) {
      const key = c.parent_id ?? "__root__";
      const list = byParent.get(key) ?? [];
      list.push(c);
      byParent.set(key, list);
    }
    for (const list of Array.from(byParent.values())) {
      list.sort((a: Category, b: Category) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
    }
    const out: Array<Category & { depth: number }> = [];
    const walk = (parent: string, depth: number) => {
      for (const c of byParent.get(parent) ?? []) {
        out.push({ ...c, depth });
        walk(c.id, depth + 1);
      }
    };
    walk("__root__", 0);
    // 父分類被刪掉的孤兒也要列出來，不然選不到。
    const seen = new Set(out.map((c) => c.id));
    for (const c of categories) if (!seen.has(c.id)) out.push({ ...c, depth: 0 });
    return out;
  }, [categories]);

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? tree.filter((c) => c.name.toLowerCase().includes(needle))
    : tree;

  const selected = new Set(value.categoryIds);
  const nameOf = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const toggle = (id: string) => {
    const next = selected.has(id)
      ? value.categoryIds.filter((x) => x !== id)
      : [...value.categoryIds, id];
    set({ categoryIds: next });
  };

  /** 後台就先算一次，讓設定人員當場看到會抓到幾件商品。 */
  const preview = useMemo(
    () => pickProductsForBlock({ settings: value, products, manualIds, categories }),
    [value, products, manualIds, categories]
  );
  /**
   * 「符合條件」要算的是篩選後的總數，不能用 preview.length——那是已經砍到
   * limit 的結果，會讓「符合 20 件但只顯示 4 件」看起來像「只符合 4 件」。
   */
  const matchedCount = useMemo(
    () =>
      pickProductsForBlock({
        settings: { ...value, limit: Number.MAX_SAFE_INTEGER },
        products,
        manualIds,
        categories,
      }).length,
    [value, products, manualIds, categories]
  );
  const expanded = useMemo(
    () => expandCategoryIds(value.categoryIds, categories, value.includeChildCategories),
    [value.categoryIds, categories, value.includeChildCategories]
  );
  /** 「食材 › 烘焙用粉」這樣的所屬路徑；最上層分類沒有路徑就回空字串。 */
  const parentPathOf = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    return (id: string): string => {
      const names: string[] = [];
      let cur = byId.get(id)?.parent_id ?? null;
      // 分類階層很淺，但還是設個上限，避免資料有環的時候卡死。
      for (let i = 0; cur && i < 10; i += 1) {
        const parent = byId.get(cur);
        if (!parent) break;
        names.unshift(parent.name);
        cur = parent.parent_id ?? null;
      }
      return names.join(" › ");
    };
  }, [categories]);

  return (
    <div className={cn("space-y-3", readOnly && "pointer-events-none opacity-60")}>
      <Field label="商品來源">
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(PRODUCT_BLOCK_SOURCE_LABELS) as ProductBlockSource[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set({ source: s })}
              className={cn(
                "rounded-[10px] border px-2.5 py-2 text-[13px] font-medium",
                value.source === s
                  ? "border-[#FFD454] bg-[#FFF9E0] text-[#153E73]"
                  : "border-[#E7EAF0] bg-white text-[#687386] hover:border-[#FFE149]"
              )}
            >
              {PRODUCT_BLOCK_SOURCE_LABELS[s]}
            </button>
          ))}
        </div>
      </Field>

      {value.source === "category" ? (
        <Field label="指定商品分類" hint="分類來自「商品分類管理」，這裡直接讀，不用先去商品主檔設定。">
          <div className="space-y-2">
            {value.categoryIds.length ? (
              <div className="flex flex-wrap gap-1.5">
                {value.categoryIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-[#FFF5CC] px-2.5 py-1 text-[12px] font-medium text-[#153E73]"
                  >
                    {nameOf(id)}
                    <button type="button" onClick={() => toggle(id)} title="移除">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => set({ categoryIds: [] })}
                  className="text-[12px] text-[#8A94A6] underline"
                >
                  全部清除
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-[#B42318]">尚未選擇分類，前台不會顯示這一區。</p>
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#8A94A6]" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜尋分類…"
                className="pl-8"
              />
            </div>

            <div className="max-h-56 overflow-y-auto rounded-[10px] border border-[#E7EAF0] bg-white">
              {loading ? (
                <p className="px-3 py-3 text-[12px] text-[#8A94A6]">分類載入中…</p>
              ) : shown.length === 0 ? (
                <p className="px-3 py-3 text-[12px] text-[#8A94A6]">沒有符合的分類</p>
              ) : (
                <ul>
                  {shown.map((c) => (
                    <li key={c.id}>
                      <label
                        className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-[#FFFDF6]"
                        style={{ paddingLeft: 12 + (needle ? 0 : c.depth * 16) }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggle(c.id)}
                        />
                        <span className="text-[#153E73]">{c.name}</span>
                        {/* 搜尋時列表是平的，同名分類會長得一模一樣，補上所屬路徑才分得出來。 */}
                        {needle && parentPathOf(c.id) ? (
                          <span className="text-[11px] text-[#8A94A6]">
                            （{parentPathOf(c.id)}）
                          </span>
                        ) : null}
                        {!selected.has(c.id) && expanded.has(c.id) ? (
                          <span className="text-[11px] text-[#8A94A6]">（含在父分類內）</span>
                        ) : null}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label className="flex items-center gap-2 text-[12px] text-[#153E73]">
              <input
                type="checkbox"
                checked={value.includeChildCategories}
                onChange={(e) => set({ includeChildCategories: e.target.checked })}
              />
              選父分類時，一併顯示子分類的商品
            </label>
          </div>
        </Field>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <Field label="顯示數量">
          <Input
            type="number"
            min={1}
            max={48}
            value={value.limit}
            onChange={(e) => set({ limit: Math.max(1, Math.min(48, Number(e.target.value) || 1)) })}
          />
        </Field>
        <Field label="商品排序">
          <select
            className="input-field w-full"
            value={value.sort}
            onChange={(e) => set({ sort: e.target.value as ProductBlockSort })}
          >
            {(Object.keys(PRODUCT_BLOCK_SORT_LABELS) as ProductBlockSort[])
              .filter((s) => s !== "manual" || value.source === "manual")
              .map((s) => (
                <option key={s} value={s}>
                  {PRODUCT_BLOCK_SORT_LABELS[s]}
                </option>
              ))}
          </select>
        </Field>
      </div>

      <Field label="顯示內容">
        <div className="space-y-1.5">
          {([
            ["showPrice", "顯示價格"],
            ["showCartButton", "顯示加入購物車按鈕"],
            ["showMoreButton", "顯示「更多商品」按鈕"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-[13px] text-[#153E73]">
              <input
                type="checkbox"
                checked={value[key]}
                onChange={(e) => set({ [key]: e.target.checked } as Partial<ProductBlockSettings>)}
              />
              {label}
            </label>
          ))}
        </div>
      </Field>

      {value.showMoreButton ? (
        <Field label="「更多商品」連到">
          <Input
            value={value.moreHref}
            onChange={(e) => set({ moreHref: e.target.value })}
            placeholder="/shop"
          />
        </Field>
      ) : null}

      <div
        className={cn(
          "rounded-[10px] px-2.5 py-2 text-[12px]",
          preview.length ? "bg-[#E8F8EF] text-[#1B6B3A]" : "bg-[#FDE8E6] text-[#B42318]"
        )}
      >
        {loading
          ? "計算中…"
          : preview.length
            ? matchedCount > value.limit
              ? `符合條件的商品：${matchedCount} 件，前台只會顯示前 ${value.limit} 件`
              : `符合條件的商品：${matchedCount} 件（上限 ${value.limit} 件）`
            : productBlockEmptyText(value)}
        {preview.length ? (
          <span className="mt-1 block truncate text-[11px] text-[#1B6B3A]/80">
            例如：{preview.slice(0, 3).map((p) => p.name).join("、")}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-[#153E73]">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-[#8A94A6]">{hint}</span> : null}
    </label>
  );
}

export { DEFAULT_PRODUCT_BLOCK };
