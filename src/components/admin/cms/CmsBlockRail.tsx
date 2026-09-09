"use client";

import { useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import type { CmsBlock } from "@/types/cms";
import { useCmsDragDrop } from "@/hooks/useCmsDragDrop";
import { getBlockDefinition } from "@/lib/cms/block-registry";
import { CmsBlockLibrary } from "@/components/admin/cms/CmsBlockLibrary";
import { cn } from "@/lib/utils";

function layoutSummary(block: CmsBlock): string {
  const cols = block.settings?.columns;
  const limit = block.settings?.display_limit ?? block.settings?.display_count;
  const layout = block.settings?.layout_type;
  const parts: string[] = [];
  if (typeof layout === "string" && layout) parts.push(layout);
  if (typeof cols === "number") parts.push(`${cols}欄`);
  if (typeof limit === "number") parts.push(`${limit}筆`);
  if (!parts.length) return block.enabled ? "顯示中" : "已隱藏";
  return parts.join(" · ");
}

type Props = {
  pageId: string;
  blocks: CmsBlock[];
  selectedBlockId: string | null;
  onSelect: (id: string | null) => void;
  onReorder: (from: number, to: number) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onAddBlock: (type: string) => void;
  readOnly?: boolean;
};

/** Left rail: page blocks list (not a fake canvas preview). */
export function CmsBlockRail({
  pageId,
  blocks,
  selectedBlockId,
  onSelect,
  onReorder,
  onDuplicate,
  onRemove,
  onToggleEnabled,
  onAddBlock,
  readOnly,
}: Props) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const drag = useCmsDragDrop(onReorder);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-[#E9EDF2] px-3 py-2.5">
        <p className="text-sm font-bold text-[#153E73]">頁面區塊</p>
        <p className="text-[11px] text-[#8A94A6]">拖曳排序 · 顯示／隱藏</p>
      </div>

      <div className="border-b border-[#E9EDF2] p-2">
        {libraryOpen && !readOnly ? (
          <div className="max-h-52 overflow-hidden rounded-[12px] border border-[#E9EDF2]">
            <CmsBlockLibrary
              pageId={pageId}
              onAddBlock={(type) => {
                onAddBlock(type);
                setLibraryOpen(false);
              }}
              disabled={readOnly}
            />
          </div>
        ) : (
          <button
            type="button"
            disabled={readOnly}
            onClick={() => setLibraryOpen(true)}
            className="flex w-full items-center justify-center gap-1 rounded-[10px] border border-dashed border-[#153E73]/30 px-2 py-2 text-sm font-semibold text-[#153E73] hover:bg-[#FFFDF6] disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            新增區塊
          </button>
        )}
      </div>

      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {blocks.length === 0 ? (
          <li className="px-2 py-8 text-center text-xs text-[#8A94A6]">
            尚無區塊
          </li>
        ) : (
          blocks.map((block, index) => {
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
                onClick={() => onSelect(block.id)}
                className={cn(
                  "group cursor-pointer rounded-[10px] border px-2 py-2 transition",
                  selected
                    ? "border-[#FFD454] bg-[#FFF9E0]"
                    : "border-transparent hover:bg-[#F7F8FA]",
                  !block.enabled && "opacity-55",
                  drag.overIndex === index &&
                    drag.draggingFrom !== index &&
                    "border-t-2 border-[#FFD454]"
                )}
              >
                <div className="flex items-start gap-1.5">
                  {!readOnly ? (
                    <span className="mt-0.5 cursor-grab text-[#C0C6D0] active:cursor-grabbing">
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#153E73]">
                      {block.name || defn?.name || block.type}
                    </p>
                    <p className="truncate text-[10px] text-[#8A94A6]">
                      {layoutSummary(block)}
                    </p>
                  </div>
                  {!readOnly ? (
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        className="rounded p-1 text-[#687386] hover:bg-white"
                        title={block.enabled ? "隱藏" : "顯示"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleEnabled(block.id, !block.enabled);
                        }}
                      >
                        {block.enabled ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-[#687386] hover:bg-white"
                        title="複製"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(block.id);
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-[#B42318] hover:bg-white"
                        title="刪除"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(block.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
