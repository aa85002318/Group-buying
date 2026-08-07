"use client";

import {
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
} from "lucide-react";
import type { CmsBlock, CmsDevice } from "@/types/cms";
import { CMS_DEVICE_SIZE } from "@/types/cms";
import { useCmsDragDrop } from "@/hooks/useCmsDragDrop";
import { getBlockDefinition } from "@/lib/cms/block-registry";
import { cn } from "@/lib/utils";

type Props = {
  blocks: CmsBlock[];
  selectedBlockId: string | null;
  onSelect: (id: string | null) => void;
  onReorder: (from: number, to: number) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  device: CmsDevice;
  showBounds: boolean;
  readOnly?: boolean;
};

export function CmsCanvas({
  blocks,
  selectedBlockId,
  onSelect,
  onReorder,
  onDuplicate,
  onRemove,
  onToggleEnabled,
  device,
  showBounds,
  readOnly,
}: Props) {
  const size = CMS_DEVICE_SIZE[device];
  const drag = useCmsDragDrop(onReorder);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[#ECECEC] px-3 py-2">
        <p className="text-sm font-bold text-[#153E73]">畫布預覽</p>
        <p className="text-[11px] text-[#8A94A6]">
          {size.label} · {size.width}×{size.height}
          {readOnly ? " · 本機排序僅供預覽，不寫入正式站" : " · 可拖拉排序（本機）"}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-[linear-gradient(180deg,#FFFDF6_0%,#EEF8FC_100%)] p-4">
        <div
          className="mx-auto overflow-hidden rounded-[20px] border border-[#E7EAF0] bg-white shadow-[0_16px_40px_rgba(21,62,115,0.08)]"
          style={{ width: Math.min(size.width, 440), maxWidth: "100%" }}
        >
          <div className="border-b border-[#F0F2F5] bg-[#153E73] px-3 py-2 text-center text-[11px] font-semibold text-white">
            CHIMEIDIY 預覽
          </div>
          {blocks.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-[#8A94A6]">
              尚未有區塊。從左側區塊庫加入，或開啟有版型的頁面載入現況。
            </div>
          ) : (
            <ul className="divide-y divide-[#F3F4F6]">
              {blocks.map((block, index) => {
                const defn = getBlockDefinition(block.type);
                const selected = selectedBlockId === block.id;
                return (
                  <li
                    key={block.id}
                    draggable={!readOnly}
                    onDragStart={() => drag.onDragStart(index)}
                    onDragOver={(e) => drag.onDragOver(index, e)}
                    onDrop={() => drag.onDrop(index)}
                    onDragEnd={drag.onDragEnd}
                    className={cn(
                      "group relative cursor-pointer px-3 py-3 transition",
                      selected && "bg-[#FFF7CC]",
                      !block.enabled && "opacity-50",
                      showBounds && "outline outline-1 outline-dashed outline-[#79C7E8]/60",
                      drag.overIndex === index &&
                        drag.draggingFrom !== index &&
                        "border-t-2 border-[#FFE149]"
                    )}
                    onClick={() => onSelect(block.id)}
                  >
                    <div className="flex items-start gap-2">
                      {!readOnly ? (
                        <span
                          className="mt-0.5 cursor-grab text-[#C0C6D0] active:cursor-grabbing"
                          title="拖拉排序"
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-[#8A94A6]">
                            #{index + 1}
                          </span>
                          <span className="truncate text-sm font-semibold text-[#153E73]">
                            {block.name}
                          </span>
                          {!block.enabled ? (
                            <span className="text-[10px] text-[#B42318]">隱藏</span>
                          ) : null}
                        </div>
                        <p className="truncate text-[11px] text-[#8A94A6]">
                          {defn?.name ?? block.type}
                          {block.sourceKey ? ` · ${block.sourceKey}` : ""}
                        </p>
                      </div>
                      {!readOnly ? (
                        <div
                          className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="rounded p-1 hover:bg-white"
                            title={block.enabled ? "隱藏" : "顯示"}
                            onClick={() => onToggleEnabled(block.id, !block.enabled)}
                          >
                            {block.enabled ? (
                              <Eye className="h-3.5 w-3.5 text-[#153E73]" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-[#8A94A6]" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="rounded p-1 hover:bg-white"
                            title="複製"
                            onClick={() => onDuplicate(block.id)}
                          >
                            <Copy className="h-3.5 w-3.5 text-[#153E73]" />
                          </button>
                          <button
                            type="button"
                            className="rounded p-1 hover:bg-white"
                            title="刪除"
                            onClick={() => onRemove(block.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-[#B42318]" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
