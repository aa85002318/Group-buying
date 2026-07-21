"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BakingCategory, BakingCategoryTreeNode } from "@/lib/baking-materials/types";

type CatalogCategorySteppedNavProps = {
  tree: BakingCategoryTreeNode[];
  categories: BakingCategory[];
  activeSlug?: string;
  className?: string;
};

/**
 * 前台烘焙材料階梯式側面分類選單
 * 大分類 → 中分類 → 小分類，點擊進入下一層或前往分類頁
 */
export function CatalogCategorySteppedNav({
  tree,
  categories,
  activeSlug,
  className,
}: CatalogCategorySteppedNavProps) {
  const byId = useMemo(() => {
    const map = new Map<string, BakingCategoryTreeNode>();
    const walk = (nodes: BakingCategoryTreeNode[]) => {
      for (const n of nodes) {
        map.set(n.id, n);
        walk(n.children);
      }
    };
    walk(tree);
    return map;
  }, [tree]);

  const active = useMemo(
    () => categories.find((c) => c.slug === activeSlug) ?? null,
    [categories, activeSlug]
  );

  const initialStack = useMemo(() => {
    if (!active) return [] as BakingCategoryTreeNode[];
    const chain: BakingCategoryTreeNode[] = [];
    let cur: BakingCategory | null | undefined = active;
    const flat = new Map(categories.map((c) => [c.id, c]));
    while (cur?.parent_id) {
      const parent = flat.get(cur.parent_id);
      if (!parent) break;
      const node = byId.get(parent.id);
      if (node) chain.unshift(node);
      cur = parent;
    }
    // 若目前是有子分類的節點，堆疊含自身以便顯示其子層
    const self = byId.get(active.id);
    if (self && self.children.length > 0) {
      chain.push(self);
    }
    return chain;
  }, [active, categories, byId]);

  const [stackOverride, setStackOverride] = useState<BakingCategoryTreeNode[] | null>(null);
  const stack = stackOverride ?? initialStack;

  // 當 URL 分類變更時，重置手動堆疊
  const stackKey = activeSlug ?? "";
  const [prevKey, setPrevKey] = useState(stackKey);
  if (prevKey !== stackKey) {
    setPrevKey(stackKey);
    if (stackOverride !== null) setStackOverride(null);
  }

  const currentNodes: BakingCategoryTreeNode[] =
    stack.length === 0 ? tree : stack[stack.length - 1]?.children ?? [];

  const goInto = (node: BakingCategoryTreeNode) => {
    if (node.children.length === 0) return;
    setStackOverride([...stack, node]);
  };

  const goBack = () => {
    setStackOverride(stack.slice(0, -1));
  };

  const goToIndex = (index: number) => {
    setStackOverride(stack.slice(0, index));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-[#6B3F24]">分類</h3>

      <div className="flex items-center gap-1 text-xs text-[#8C644A]">
        {stack.length > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-[#FFF9EA]"
            aria-label="返回上一層"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <nav className="flex min-w-0 flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setStackOverride([])}
            className={cn(
              "rounded px-1 py-0.5",
              stack.length === 0 ? "font-semibold text-[#FF5A5F]" : "hover:text-[#FF5A5F]"
            )}
          >
            全部
          </button>
          {stack.map((node, i) => (
            <span key={node.id} className="flex items-center gap-1">
              <span>›</span>
              <button
                type="button"
                onClick={() => goToIndex(i + 1)}
                className={cn(
                  "max-w-[6.5rem] truncate rounded px-1 py-0.5",
                  i === stack.length - 1
                    ? "font-semibold text-[#FF5A5F]"
                    : "hover:text-[#FF5A5F]"
                )}
              >
                {node.name}
              </button>
            </span>
          ))}
        </nav>
      </div>

      <ul className="space-y-0.5">
        <li>
          <Link
            href={
              stack.length > 0
                ? `/baking-materials/${stack[stack.length - 1].slug}`
                : "/baking-materials"
            }
            className={cn(
              "block rounded-md px-2 py-1.5 text-sm transition",
              (!activeSlug && stack.length === 0) ||
                (stack.length > 0 && activeSlug === stack[stack.length - 1].slug)
                ? "bg-[#FFF9EA] font-semibold text-[#FF5A5F]"
                : "text-[#6B3F24] hover:bg-[#FFF9EA]"
            )}
          >
            {stack.length > 0 ? `此層全部（${stack[stack.length - 1].name}）` : "全部商品"}
          </Link>
        </li>

        {currentNodes.map((node) => {
          const isActive = node.slug === activeSlug;
          const hasKids = node.children.length > 0;
          return (
            <li key={node.id}>
              <div
                className={cn(
                  "flex items-center gap-0.5 rounded-md",
                  isActive && "bg-[#FFF9EA]"
                )}
              >
                <Link
                  href={`/baking-materials/${node.slug}`}
                  className={cn(
                    "min-w-0 flex-1 truncate px-2 py-1.5 text-sm transition",
                    isActive
                      ? "font-semibold text-[#FF5A5F]"
                      : "text-[#6B3F24] hover:text-[#FF5A5F]"
                  )}
                >
                  {node.name}
                </Link>
                {hasKids && (
                  <button
                    type="button"
                    onClick={() => goInto(node)}
                    className="mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#8C644A] hover:bg-white hover:text-[#FF5A5F]"
                    aria-label={`查看 ${node.name} 子分類`}
                    title="查看子分類"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
