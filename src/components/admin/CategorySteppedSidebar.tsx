"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/lib/types/database";

const LEVEL_LABELS: Record<number, string> = {
  1: "大分類",
  2: "中分類",
  3: "小分類",
  4: "細分類",
};

function resolveLevel(c: ProductCategory): number {
  if (c.level && c.level >= 1) return c.level;
  return c.parent_id ? 2 : 1;
}

type CategorySteppedSidebarProps = {
  categories: ProductCategory[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
  /** 預設聚焦烘焙材料目錄；傳 null 顯示全部 */
  preferCatalogRootId?: string | null;
  title?: string;
};

/**
 * 階梯式側面分類選單：大分類 → 中分類 → 小分類
 * - 點分類列右側箭頭：進入下一層
 * - 點左側勾選：加入／移除商品分類（第一個為主分類）
 */
export function CategorySteppedSidebar({
  categories,
  selectedIds,
  onChange,
  className,
  preferCatalogRootId,
  title = "商品分類",
}: CategorySteppedSidebarProps) {
  const [stack, setStack] = useState<ProductCategory[]>([]);
  const [query, setQuery] = useState("");

  const scoped = useMemo(() => {
    if (!preferCatalogRootId) return categories;
    const baking = categories.filter((c) => c.catalog_root_id === preferCatalogRootId);
    return baking.length > 0 ? baking : categories;
  }, [categories, preferCatalogRootId]);

  const byParent = useMemo(() => {
    const map = new Map<string | null, ProductCategory[]>();
    for (const c of scoped) {
      const key = c.parent_id ?? null;
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    }
    Array.from(map.values()).forEach((list) => {
      list.sort(
        (a, b) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
          a.name.localeCompare(b.name, "zh-TW")
      );
    });
    return map;
  }, [scoped]);

  const byId = useMemo(() => {
    const map = new Map<string, ProductCategory>();
    scoped.forEach((c) => map.set(c.id, c));
    return map;
  }, [scoped]);

  const currentParentId = stack.length ? stack[stack.length - 1].id : null;
  const currentLevel = stack.length + 1;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return scoped.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.slug ?? "").toLowerCase().includes(q)
      );
    }
    return byParent.get(currentParentId) ?? [];
  }, [byParent, currentParentId, query, scoped]);

  const searching = query.trim().length > 0;

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const setPrimary = (id: string) => {
    if (!selectedIds.includes(id)) {
      onChange([id, ...selectedIds]);
      return;
    }
    onChange([id, ...selectedIds.filter((x) => x !== id)]);
  };

  const goInto = (cat: ProductCategory) => {
    setQuery("");
    setStack((prev) => [...prev, cat]);
  };

  const goBack = () => {
    setQuery("");
    setStack((prev) => prev.slice(0, -1));
  };

  const goToIndex = (index: number) => {
    setQuery("");
    setStack((prev) => prev.slice(0, index));
  };

  const selectedCats = selectedIds
    .map((id) => byId.get(id))
    .filter((c): c is ProductCategory => Boolean(c));

  const hasChildren = (id: string) => (byParent.get(id)?.length ?? 0) > 0;

  return (
    <aside
      className={cn(
        "flex min-h-[320px] w-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-card",
        className
      )}
    >
      <div className="border-b border-border bg-[#FFF9EA] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-coffee">{title}</h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {LEVEL_LABELS[currentLevel] ?? `第 ${currentLevel} 層`}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          勾選分類 · 右側箭頭進入下一層 · 第一個為主分類
        </p>
      </div>

      {/* 麵包屑 */}
      <div className="flex items-center gap-1 border-b border-border px-2 py-2 text-xs">
        {stack.length > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-muted"
            aria-label="返回上一層"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-1 overflow-hidden">
          <button
            type="button"
            onClick={() => goToIndex(0)}
            className={cn(
              "truncate rounded px-1.5 py-0.5 font-medium",
              stack.length === 0 ? "text-primary" : "text-muted-foreground hover:text-primary"
            )}
          >
            全部
          </button>
          {stack.map((cat, i) => (
            <span key={cat.id} className="flex min-w-0 items-center gap-1">
              <span className="text-muted-foreground">›</span>
              <button
                type="button"
                onClick={() => goToIndex(i + 1)}
                className={cn(
                  "max-w-[7rem] truncate rounded px-1.5 py-0.5",
                  i === stack.length - 1
                    ? "font-semibold text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                {cat.name}
              </button>
            </span>
          ))}
        </nav>
      </div>

      {/* 搜尋 */}
      <div className="relative border-b border-border px-2 py-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋分類名稱…"
          className="h-8 w-full rounded-lg border border-border bg-white pl-8 pr-2 text-xs outline-none focus:border-primary"
        />
      </div>

      {/* 已選摘要 */}
      {selectedCats.length > 0 && (
        <div className="space-y-1.5 border-b border-border px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground">
            已選 {selectedCats.length} 個
            {selectedCats[0] ? ` · 主分類：${selectedCats[0].name}` : ""}
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedCats.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                title={i === 0 ? "主分類（再點可移除）" : "點擊移除；雙擊設為主分類"}
                onDoubleClick={() => setPrimary(c.id)}
                className={cn(
                  "inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  i === 0
                    ? "bg-primary text-white"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                {i === 0 && <span className="opacity-80">主</span>}
                <span className="truncate">{c.name}</span>
                <span aria-hidden>×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 列表 */}
      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {visible.length === 0 ? (
          <li className="px-2 py-6 text-center text-xs text-muted-foreground">
            {searching ? "找不到符合的分類" : "此層尚無子分類"}
          </li>
        ) : (
          visible.map((cat) => {
            const checked = selectedIds.includes(cat.id);
            const isPrimary = selectedIds[0] === cat.id;
            const deeper = !searching && hasChildren(cat.id);
            const level = resolveLevel(cat);

            return (
              <li key={cat.id}>
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-lg border transition",
                    checked
                      ? "border-primary/30 bg-primary/5"
                      : "border-transparent hover:bg-muted/60"
                  )}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(cat.id)}
                      className="h-4 w-4 shrink-0 rounded border-border text-primary"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-coffee">
                          {cat.name}
                        </span>
                        {isPrimary && (
                          <span className="shrink-0 rounded bg-primary px-1 py-px text-[9px] font-bold text-white">
                            主
                          </span>
                        )}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        {LEVEL_LABELS[level] ?? `L${level}`}
                        {searching && cat.path ? ` · ${cat.path}` : ""}
                      </span>
                    </span>
                  </label>
                  {checked && !isPrimary && (
                    <button
                      type="button"
                      className="shrink-0 px-1 text-[10px] font-semibold text-primary hover:underline"
                      onClick={() => setPrimary(cat.id)}
                    >
                      設主
                    </button>
                  )}
                  {deeper && (
                    <button
                      type="button"
                      onClick={() => goInto(cat)}
                      className="mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-white hover:text-primary"
                      aria-label={`進入 ${cat.name} 子分類`}
                      title="進入子分類"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
