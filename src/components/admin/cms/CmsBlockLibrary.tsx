"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CMS_BLOCK_REGISTRY,
  listBlocksByCategory,
  type CmsBlockDefinition,
} from "@/lib/cms/block-registry";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  basic: "基礎內容",
  nav: "導覽與入口",
  product: "商品",
  recipe: "食譜",
  group_buy: "團購",
  member: "會員",
  service: "服務",
  global: "全站",
};

type Props = {
  pageId: string;
  allowedTypes?: string[];
  onAddBlock: (type: string) => void;
  disabled?: boolean;
};

export function CmsBlockLibrary({
  pageId,
  allowedTypes,
  onAddBlock,
  disabled,
}: Props) {
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const byCat = listBlocksByCategory();
    const allow = allowedTypes ? new Set(allowedTypes) : null;
    const out: Array<{ category: string; items: CmsBlockDefinition[] }> = [];
    for (const [category, items] of Object.entries(byCat)) {
      const filtered = items.filter((b) => {
        if (b.disabledReason) return false;
        if (allow && !allow.has(b.type)) return false;
        if (
          b.allowedPageIds?.length &&
          !b.allowedPageIds.includes(pageId) &&
          pageId !== "custom"
        ) {
          return false;
        }
        if (q.trim()) {
          const needle = q.trim().toLowerCase();
          return (
            b.name.toLowerCase().includes(needle) ||
            b.type.toLowerCase().includes(needle)
          );
        }
        return true;
      });
      if (filtered.length) out.push({ category, items: filtered });
    }
    return out;
  }, [allowedTypes, pageId, q]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[#ECECEC] p-3">
        <p className="mb-2 text-sm font-bold text-[#153E73]">區塊庫</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#8A94A6]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋區塊…"
            className="pl-8"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {groups.length === 0 ? (
          <p className="text-sm text-[#8A94A6]">沒有符合的區塊</p>
        ) : (
          groups.map((g) => (
            <div key={g.category}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8A94A6]">
                {CATEGORY_LABEL[g.category] ?? g.category}
              </p>
              <ul className="space-y-1.5">
                {g.items.map((b) => (
                  <li key={b.type}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onAddBlock(b.type)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[12px] border border-[#E7EAF0] bg-white px-3 py-2 text-left text-sm transition hover:border-[#FFE149] hover:bg-[#FFFDF6]",
                        disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <span>
                        <span className="block font-medium text-[#153E73]">{b.name}</span>
                        {b.description ? (
                          <span className="block text-[11px] text-[#8A94A6]">
                            {b.description}
                          </span>
                        ) : null}
                      </span>
                      <Plus className="h-4 w-4 shrink-0 text-[#153E73]" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
        <p className="text-[11px] text-[#8A94A6]">
          已註冊 {CMS_BLOCK_REGISTRY.length} 種區塊（多數設定面板於後續階段開放）
        </p>
      </div>
      {!disabled ? (
        <div className="border-t border-[#ECECEC] p-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => onAddBlock("spacer")}
          >
            <Plus className="mr-1 h-4 w-4" />
            快速加入間距
          </Button>
        </div>
      ) : null}
    </div>
  );
}
