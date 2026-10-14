import type { CmsBlock } from "@/types/cms";
import { getBlockDefinition } from "@/lib/cms/block-registry";
import { SECTION_DEFAULTS } from "@/lib/home/blocks";
import { isHomeSectionKey } from "@/lib/home/section-keys";

export function createEmptyBlock(type: string, order: number): CmsBlock {
  const defn = getBlockDefinition(type);
  // 首頁區塊：帶著該有的標題、筆數、資料來源出生。否則新區塊什麼都是 null，
  // 存起來之後前台不知道要顯示幾筆，看起來就像「新增了卻沒出現」。
  const home = isHomeSectionKey(type) ? SECTION_DEFAULTS[type] : undefined;
  return {
    id: `blk-${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    name: home?.title || defn?.name || type,
    enabled: true,
    order,
    settings: home
      ? {
          title: home.title,
          display_count: home.displayCount ?? null,
          source_mode: home.sourceMode ?? null,
          data_source: home.dataSource ?? null,
          view_all_url: home.viewAllUrl ?? null,
          manual_ids: [],
          config: { ...(home.config ?? {}) },
        }
      : {},
  };
}

export function cloneBlock(block: CmsBlock, order: number): CmsBlock {
  return {
    ...block,
    id: `blk-${block.type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    order,
    name: `${block.name}（副本）`,
    settings: { ...block.settings },
    responsiveSettings: block.responsiveSettings
      ? structuredClone(block.responsiveSettings)
      : undefined,
  };
}

export function reorderBlocks(blocks: CmsBlock[], from: number, to: number): CmsBlock[] {
  if (from === to || from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) {
    return blocks;
  }
  const next = [...blocks];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((b, i) => ({ ...b, order: i }));
}
