"use client";

import { useMemo } from "react";
import type { ProductCategory } from "@/lib/types/database";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/admin/category-tree";
import { cn } from "@/lib/utils";

type CategoryGroupedSelectProps = {
  categories: ProductCategory[];
  value: string;
  onChange: (id: string) => void;
  emptyLabel?: string;
  className?: string;
  id?: string;
};

/**
 * Single-select: 大分類 as optgroup, children listed in sort order.
 * Parent itself is the first option inside the group.
 */
export function CategoryGroupedSelect({
  categories,
  value,
  onChange,
  emptyLabel = "不指定／依 Excel 分類欄",
  className,
  id,
}: CategoryGroupedSelectProps) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  return (
    <select
      id={id}
      className={cn(
        "mt-1 h-12 w-full rounded-[16px] border border-border bg-white px-3 text-sm",
        className
      )}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{emptyLabel}</option>
      {tree.map((node) => {
        if (node.children.length === 0) {
          return (
            <option key={node.category.id} value={node.category.id}>
              {node.category.name}
            </option>
          );
        }
        return (
          <optgroup key={node.category.id} label={node.category.name}>
            <option value={node.category.id}>{node.category.name}（大分類）</option>
            {flattenCategoryTree(node.children, 1).map((row) => (
              <option key={row.category.id} value={row.category.id}>
                {row.label}
              </option>
            ))}
          </optgroup>
        );
      })}
      {tree.length === 0 ? <option disabled>尚無分類</option> : null}
    </select>
  );
}
