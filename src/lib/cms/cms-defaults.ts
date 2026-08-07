import type { CmsBlock } from "@/types/cms";
import { getBlockDefinition } from "@/lib/cms/block-registry";

export function createEmptyBlock(type: string, order: number): CmsBlock {
  const defn = getBlockDefinition(type);
  return {
    id: `blk-${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    name: defn?.name ?? type,
    enabled: true,
    order,
    settings: {},
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
