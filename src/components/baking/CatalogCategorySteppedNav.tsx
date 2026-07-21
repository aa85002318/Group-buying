"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BakingCategory, BakingCategoryTreeNode } from "@/lib/baking-materials/types";

type CatalogCategorySteppedNavProps = {
  tree: BakingCategoryTreeNode[];
  categories: BakingCategory[];
  activeSlug?: string;
  className?: string;
  /** 點分類連結時回呼（關閉 drawer） */
  onNavigate?: () => void;
  /** 隱藏標題（外層已有區塊標題時） */
  hideTitle?: boolean;
};

/**
 * 前台烘焙材料階梯式側面分類選單
 * 大分類 → 中分類 → 小分類
 */
export function CatalogCategorySteppedNav({
  tree,
  categories,
  activeSlug,
  className,
  onNavigate,
  hideTitle = false,
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

  const derivedStack = useMemo(() => {
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
    const self = byId.get(active.id);
    if (self && self.children.length > 0) {
      chain.push(self);
    }
    return chain;
  }, [active, categories, byId]);

  const [stack, setStack] = useState<BakingCategoryTreeNode[]>(derivedStack);

  useEffect(() => {
    setStack(derivedStack);
  }, [derivedStack]);

  const currentNodes: BakingCategoryTreeNode[] =
    stack.length === 0 ? tree : stack[stack.length - 1]?.children ?? [];

  const goInto = (node: BakingCategoryTreeNode) => {
    if (node.children.length === 0) return;
    setStack((prev) => [...prev, node]);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {!hideTitle && <h3 className="text-sm font-semibold text-[#6B3F24]">分類</h3>}

      <div className="flex items-center gap-1 text-xs text-[#8C644A]">
        {stack.length > 0 && (
          <button
            type="button"
            onClick={() => setStack((prev) => prev.slice(0, -1))}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-[#FFF9EA]"
            aria-label="返回上一層"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <nav className="flex min-w-0 flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setStack([])}
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
                onClick={() => setStack((prev) => prev.slice(0, i + 1))}
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
            onClick={onNavigate}
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
                  onClick={onNavigate}
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
