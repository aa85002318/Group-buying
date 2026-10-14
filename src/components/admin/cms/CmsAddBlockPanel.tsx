"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  LayoutGrid,
  Minus,
  ShoppingBag,
  Type as TypeIcon,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HOME_ADDABLE_BLOCK_TYPES,
  HOME_REPEATABLE_BLOCK_TYPES,
  getBlockDefinition,
} from "@/lib/cms/block-registry";

/**
 * 首頁「新增區塊」面板。
 *
 * 舊的區塊庫把二十幾種區塊混在一起，其中大部分是「每頁只能一個、而且已經在
 * 頁面上」的，按了沒反應，看起來就像不能新增。這裡只留真正能按的：
 * 最常用的兩種放最上面（圖片資訊、商品區域），其餘可重複的放第二排，
 * 每頁一個的固定區塊收在最下面，而且已經在頁面上的直接不列出來。
 */

type Choice = {
  type: string;
  label: string;
  hint: string;
  Icon: typeof ImageIcon;
};

const PRIMARY: Choice[] = [
  {
    type: "custom_banner",
    label: "圖片資訊",
    hint: "一張圖片，可加標題、說明和連結",
    Icon: ImageIcon,
  },
  {
    type: "custom_products",
    label: "商品區域",
    hint: "自己挑商品排成一列",
    Icon: ShoppingBag,
  },
];

const SECONDARY: Choice[] = [
  { type: "custom_text", label: "圖文區塊", hint: "文字＋圖片＋按鈕", Icon: TypeIcon },
  { type: "custom_categories", label: "分類列", hint: "挑分類排成一列", Icon: LayoutGrid },
  { type: "custom_recipes", label: "食譜列", hint: "挑食譜排成一列", Icon: UtensilsCrossed },
  { type: "custom_spacer", label: "空白間距", hint: "兩個區塊之間留白", Icon: Minus },
];

export function CmsAddBlockPanel({
  usedTypes,
  onAdd,
  onClose,
  disabled,
}: {
  /** block_key 已經在頁面上的區塊 */
  usedTypes: string[];
  onAdd: (type: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const used = new Set(usedTypes);
  const [fixedOpen, setFixedOpen] = useState(false);

  // 每頁一個、而且還沒放上頁面的固定區塊
  const fixedAvailable = HOME_ADDABLE_BLOCK_TYPES.filter(
    (t) => !HOME_REPEATABLE_BLOCK_TYPES.has(t) && !used.has(t)
  );

  const card = (c: Choice, big: boolean) => (
    <button
      key={c.type}
      type="button"
      disabled={disabled}
      onClick={() => onAdd(c.type)}
      className={cn(
        "flex w-full items-start gap-2 rounded-[12px] border bg-white text-left transition disabled:cursor-not-allowed disabled:opacity-50",
        big
          ? "border-[#FFD454] px-3 py-3 hover:bg-[#FFFDF6]"
          : "border-[#E7EAF0] px-2.5 py-2 hover:border-[#FFE149] hover:bg-[#FFFDF6]"
      )}
    >
      <c.Icon
        className={cn("mt-0.5 shrink-0 text-[#153E73]", big ? "h-5 w-5" : "h-4 w-4")}
      />
      <span className="min-w-0">
        <span
          className={cn(
            "block font-semibold text-[#153E73]",
            big ? "text-sm" : "text-[13px]"
          )}
        >
          {c.label}
        </span>
        <span className="block text-[11px] leading-snug text-[#8A94A6]">{c.hint}</span>
      </span>
    </button>
  );

  return (
    <div className="flex max-h-[420px] min-h-0 flex-col rounded-[12px] border border-[#E9EDF2] bg-[#FAFBFC]">
      <div className="flex items-center justify-between border-b border-[#E9EDF2] px-3 py-2">
        <p className="text-sm font-bold text-[#153E73]">新增區塊</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[#8A94A6] hover:bg-white"
          title="關閉"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <div className="space-y-2">{PRIMARY.map((c) => card(c, true))}</div>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold text-[#8A94A6]">
            其他（都可以放很多個）
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {SECONDARY.map((c) => card(c, false))}
          </div>
        </div>

        <div className="rounded-[12px] border border-[#E9EDF2] bg-white">
          <button
            type="button"
            onClick={() => setFixedOpen((v) => !v)}
            className="flex w-full items-center justify-between px-2.5 py-2 text-left"
          >
            <span className="text-[12px] font-semibold text-[#153E73]">
              頁面固定區塊（每頁一個）
            </span>
            {fixedOpen ? (
              <ChevronDown className="h-4 w-4 text-[#8A94A6]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[#8A94A6]" />
            )}
          </button>
          {fixedOpen ? (
            <div className="border-t border-[#E9EDF2] p-2">
              {fixedAvailable.length === 0 ? (
                <p className="px-1 py-2 text-[11px] text-[#8A94A6]">
                  固定區塊都已經在頁面上了，不需要再新增。
                </p>
              ) : (
                <ul className="space-y-1">
                  {fixedAvailable.map((type) => (
                    <li key={type}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onAdd(type)}
                        className="w-full rounded-[10px] border border-[#E7EAF0] px-2.5 py-1.5 text-left text-[13px] font-medium text-[#153E73] hover:border-[#FFE149] hover:bg-[#FFFDF6] disabled:opacity-50"
                      >
                        {getBlockDefinition(type)?.name ?? type}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <p className="text-[11px] leading-relaxed text-[#8A94A6]">
          新增後會直接選取那個區塊，右邊就能填內容。填完記得按「儲存草稿」，
          再按「發布」網站才會改變。
        </p>
      </div>
    </div>
  );
}
