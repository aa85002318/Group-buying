"use client";

import { useEffect, useRef, useState } from "react";
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
import { CmsAddBlockPanel } from "@/components/admin/cms/CmsAddBlockPanel";
import { cn } from "@/lib/utils";
import { describeBlockLayout } from "@/lib/cms/plain-labels";
import { isPageUnified } from "@/lib/cms/page-builder";
import { parseProductBlockSettings } from "@/lib/home/product-block";
import { homeBlockKey, homeBlockThumbnail } from "@/components/admin/cms/HomeBlockContentEditor";

function websiteVisible(block: CmsBlock): boolean {
  const cfg = block.settings?.config as Record<string, unknown> | undefined;
  return typeof cfg?.desktop_visible === "boolean" ? cfg.desktop_visible : block.enabled;
}

/** Added blocks only appear on the site once they have content. */
function needsContent(block: CmsBlock): boolean {
  const key = homeBlockKey(block);
  const cfg = (block.settings?.config ?? {}) as Record<string, unknown>;
  const ids = Array.isArray(block.settings?.manual_ids)
    ? (block.settings?.manual_ids as string[])
    : [];
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  if (key === "custom_banner") return !str(cfg.image_url) && !str(cfg.mobile_image_url);
  if (key === "custom_products") {
    // 商品來源不只「手動指定」一種。選了分類／全部／最新／熱門時區塊就是設定好的，
    // 只有「手動指定卻沒挑商品」或「指定分類卻沒選分類」才算沒設定。
    // 這裡直接用前台同一支解析函式，避免兩邊對「來源」的判讀走偏。
    const settings = parseProductBlockSettings(cfg, {
      displayCount:
        typeof block.settings?.display_count === "number" ? block.settings.display_count : null,
      sourceMode:
        typeof block.settings?.source_mode === "string" ? block.settings.source_mode : null,
    });
    if (settings.source === "manual") return ids.length === 0;
    if (settings.source === "category") return settings.categoryIds.length === 0;
    return false;
  }
  if (key === "custom_recipes") {
    return block.settings?.source_mode === "manual" && ids.length === 0;
  }
  if (key === "custom_text") {
    return !str(cfg.body) && !str(cfg.image_url) && !str(block.settings?.title);
  }
  return false;
}

/** Unified home: where the block shows + shared count. */
function unifiedSummary(block: CmsBlock): string {
  const app = block.enabled;
  const web = websiteVisible(block);
  const where = app && web ? "手機＋網站" : app ? "只在手機" : web ? "只在網站" : "都已隱藏";
  if (needsContent(block)) return "尚未設定內容，前台不會顯示";
  const n = block.settings?.display_count ?? block.settings?.display_limit;
  return typeof n === "number" ? `${where}・顯示 ${n} 筆` : where;
}

function layoutSummary(block: CmsBlock): string {
  const summary = describeBlockLayout(block.settings as Record<string, unknown> | undefined);
  if (!block.enabled) return summary ? `已隱藏・${summary}` : "已隱藏";
  return summary ?? "顯示中";
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
  /**
   * 統一版首頁專用：這顆按鈕只切手機，不可以把網站版一起關掉。
   * `enabled` 是手機的新狀態，`desktopVisible` 是要釘住的網站版狀態。
   */
  onToggleMobileVisible?: (id: string, enabled: boolean, desktopVisible: boolean) => void;
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
  onToggleMobileVisible,
  onAddBlock,
  readOnly,
}: Props) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const drag = useCmsDragDrop(onReorder);
  const unified = isPageUnified(pageId);
  const listRef = useRef<HTMLUListElement>(null);

  // 新增或選取區塊後，把它捲到看得到的位置（不然新區塊會躲在長清單下面，
  // 看起來就像「按了沒反應」）。
  useEffect(() => {
    if (!selectedBlockId) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-block-id="${selectedBlockId}"]`
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedBlockId, blocks.length]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-[#E9EDF2] px-3 py-2.5">
        <p className="text-sm font-bold text-[#153E73]">頁面區塊</p>
        <p className="text-[11px] text-[#8A94A6]">
          {unified ? "拖曳排序（手機、網站一起變）" : "拖曳排序 · 顯示／隱藏"}
        </p>
      </div>

      <div className="border-b border-[#E9EDF2] p-2">
        {libraryOpen && !readOnly && unified ? (
          <CmsAddBlockPanel
            usedTypes={blocks.map((b) => homeBlockKey(b))}
            disabled={readOnly}
            onClose={() => setLibraryOpen(false)}
            onAdd={(type) => {
              onAddBlock(type);
              setLibraryOpen(false);
            }}
          />
        ) : libraryOpen && !readOnly ? (
          <div className="max-h-52 overflow-hidden rounded-[12px] border border-[#E9EDF2]">
            <CmsBlockLibrary
              pageId={pageId}
              allowedTypes={undefined}
              usedTypes={undefined}
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

      <ul ref={listRef} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
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
                data-block-id={block.id}
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
                  (unified ? !block.enabled && !websiteVisible(block) : !block.enabled) &&
                    "opacity-55",
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
                  {unified ? (
                    <span className="mt-0.5 h-8 w-10 shrink-0 overflow-hidden rounded bg-[#F2F4F7]">
                      {homeBlockThumbnail(block) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={homeBlockThumbnail(block)!} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#153E73]">
                      {(unified && typeof block.settings?.title === "string" && block.settings.title) ||
                        block.name ||
                        defn?.name ||
                        block.type}
                    </p>
                    <p className="truncate text-[10px] text-[#8A94A6]">
                      {unified ? unifiedSummary(block) : layoutSummary(block)}
                    </p>
                  </div>
                  {!readOnly ? (
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        className="rounded p-1 text-[#687386] hover:bg-white"
                        title={
                          unified
                            ? block.enabled
                              ? "在手機隱藏"
                              : "在手機顯示"
                            : block.enabled
                              ? "隱藏"
                              : "顯示"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          // 統一版：這顆只切手機。先把網站版目前的狀態釘住，
                          // 否則 desktop_visible 沒設時會跟著 enabled 一起被關掉。
                          if (unified && onToggleMobileVisible) {
                            onToggleMobileVisible(
                              block.id,
                              !block.enabled,
                              websiteVisible(block)
                            );
                          } else {
                            onToggleEnabled(block.id, !block.enabled);
                          }
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
