"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { ProductCategory } from "@/lib/types/database";
import { buildCategoryTree, type CategoryTreeNode } from "@/lib/admin/category-tree";
import { cn } from "@/lib/utils";

type CategoryGroupedPickerProps = {
  categories: ProductCategory[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
  title?: string;
};

function matchesQuery(cat: ProductCategory, q: string) {
  return (
    cat.name.toLowerCase().includes(q) ||
    (cat.slug ?? "").toLowerCase().includes(q) ||
    (cat.path ?? "").toLowerCase().includes(q)
  );
}

function nodeOrDescendantMatches(node: CategoryTreeNode, q: string): boolean {
  if (!q) return true;
  if (matchesQuery(node.category, q)) return true;
  return node.children.some((child) => nodeOrDescendantMatches(child, q));
}

/**
 * 大分類 → 小分類 accordion picker. Parents stay visible; children listed in sort_order.
 */
export function CategoryGroupedPicker({
  categories,
  selectedIds,
  onChange,
  className,
  title = "商品分類設定",
}: CategoryGroupedPickerProps) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const byId = useMemo(() => {
    const map = new Map<string, ProductCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const q = query.trim().toLowerCase();
  const rootIds = useMemo(() => tree.map((node) => node.category.id), [tree]);

  const visibleTree = useMemo(
    () => (q ? tree.filter((node) => nodeOrDescendantMatches(node, q)) : tree),
    [tree, q]
  );

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

  const selectedCats = selectedIds
    .map((id) => byId.get(id))
    .filter((c): c is ProductCategory => Boolean(c));

  const renderNode = (node: CategoryTreeNode, depth: number) => {
    const { category, children } = node;
    if (q && !nodeOrDescendantMatches(node, q)) return null;

    const checked = selectedIds.includes(category.id);
    const isPrimary = selectedIds[0] === category.id;
    const isGroup = children.length > 0 && depth === 0;
    const open = q ? true : collapsed[category.id] !== true;

    return (
      <li key={category.id}>
        <div
          className={cn(
            "flex items-center gap-1 rounded-lg",
            depth === 0 && children.length > 0 ? "bg-[#FFF9EA]" : "",
            checked ? "ring-1 ring-primary/25" : ""
          )}
          style={{ paddingLeft: depth > 0 ? 8 + depth * 12 : 4 }}
        >
          {isGroup ? (
            <button
              type="button"
              className="inline-flex h-8 w-7 shrink-0 items-center justify-center text-[#153E73]"
              aria-label={open ? "收合小分類" : "展開小分類"}
              onClick={() =>
                setCollapsed((prev) => ({ ...prev, [category.id]: open }))
              }
            >
              <ChevronDown
                className={cn("h-4 w-4 transition", open ? "" : "-rotate-90")}
              />
            </button>
          ) : (
            <span className="w-3 shrink-0" />
          )}
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1.5 pr-2">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(category.id)}
              className="h-4 w-4 shrink-0 rounded border-border text-primary"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "truncate text-sm text-coffee",
                    depth === 0 ? "font-bold" : "font-medium"
                  )}
                >
                  {category.name}
                </span>
                {depth === 0 && children.length > 0 ? (
                  <span className="shrink-0 text-[10px] font-semibold text-[#687386]">
                    大分類
                  </span>
                ) : depth > 0 ? (
                  <span className="shrink-0 text-[10px] text-[#687386]">小分類</span>
                ) : null}
                {isPrimary ? (
                  <span className="shrink-0 rounded bg-primary px-1 py-px text-[9px] font-bold text-white">
                    主
                  </span>
                ) : null}
              </span>
            </span>
          </label>
          {checked && !isPrimary ? (
            <button
              type="button"
              className="shrink-0 px-1.5 text-[10px] font-semibold text-primary hover:underline"
              onClick={() => setPrimary(category.id)}
            >
              設主
            </button>
          ) : null}
        </div>
        {children.length > 0 && (isGroup ? open : true) ? (
          <ul className="space-y-0.5">
            {children.map((child) => renderNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <aside
      className={cn(
        "flex min-h-[320px] w-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-card",
        className
      )}
    >
      <div className="border-b border-border bg-[#FFF9EA] px-3 py-3">
        <h3 className="text-sm font-bold text-coffee">{title}</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          依大分類 → 小分類排序勾選，第一個為主分類
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="text-[11px] font-semibold text-primary hover:underline"
            onClick={() => setCollapsed({})}
          >
            全部展開
          </button>
          <button
            type="button"
            className="text-[11px] font-semibold text-primary hover:underline"
            onClick={() =>
              setCollapsed(Object.fromEntries(rootIds.map((id) => [id, true])))
            }
          >
            全部收合
          </button>
        </div>
      </div>

      {selectedCats.length > 0 ? (
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
                className={cn(
                  "inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  i === 0
                    ? "bg-primary text-white"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                {i === 0 ? <span className="opacity-80">主</span> : null}
                <span className="truncate">{c.name}</span>
                <span aria-hidden>×</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative border-b border-border px-2 py-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋大分類或小分類…"
          className="h-8 w-full rounded-lg border border-border bg-white pl-8 pr-2 text-xs outline-none focus:border-primary"
        />
      </div>

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {visibleTree.length === 0 ? (
          <li className="px-2 py-6 text-center text-xs text-muted-foreground">
            {q ? "找不到符合的分類" : "尚無分類"}
          </li>
        ) : (
          visibleTree.map((node) => renderNode(node, 0))
        )}
      </ul>
    </aside>
  );
}
