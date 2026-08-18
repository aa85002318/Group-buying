import type { CmsBlock, CmsPage } from "@/types/cms";
import { resolveBlockTypeFromLegacyKey, getBlockDefinition } from "@/lib/cms/block-registry";
import { getPageRegistryEntry, registryEntryToCmsPage } from "@/lib/cms/page-registry";
import type { HomepageBlock } from "@/lib/types/database";
import type { ShopLayoutSettings } from "@/lib/shop/layout-settings";
import {
  mergeShopLayoutSettings,
  SHOP_LAYOUT_SECTION_LABELS,
} from "@/lib/shop/layout-settings";
import type { ShopHomeSettings } from "@/lib/shop/home-settings";
import type { GroupBuyPageSettings } from "@/lib/group-buy/page-settings";
import { SECTION_LABELS as GROUP_BUY_SECTION_LABELS } from "@/lib/group-buy/page-settings";

function newBlockId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function blockFromLegacy(
  legacyKey: string,
  order: number,
  enabled: boolean,
  settings: Record<string, unknown> = {},
  nameOverride?: string
): CmsBlock {
  const type = resolveBlockTypeFromLegacyKey(legacyKey);
  const defn = getBlockDefinition(type);
  return {
    id: newBlockId(legacyKey),
    type,
    name: nameOverride || defn?.name || legacyKey,
    enabled,
    order,
    settings: { ...settings, legacyKey },
    sourceKey: legacyKey,
  };
}

/** homepage_blocks → CmsPage (readonly adapter). */
export function adaptHomeBlocksToCmsPage(
  blocks: HomepageBlock[],
  meta?: { draftVersion?: number; publishedVersion?: number; updatedAt?: string; publishedAt?: string }
): CmsPage {
  const entry = getPageRegistryEntry("home")!;
  const sorted = [...blocks].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  const cmsBlocks = sorted.map((b, i) =>
    blockFromLegacy(
      b.block_key,
      i,
      b.is_visible !== false,
      {
        title: b.title,
        subtitle: b.subtitle,
        display_count: b.display_count,
        source_mode: b.source_mode,
        data_source: b.data_source,
        view_all_url: b.view_all_url,
        manual_ids: b.manual_ids,
        config: b.config,
        instance_label: b.instance_label,
        db_id: b.id,
      },
      b.instance_label || undefined
    )
  );
  return registryEntryToCmsPage(entry, {
    blocks: cmsBlocks,
    blockCount: cmsBlocks.length,
    draftVersion: meta?.draftVersion,
    publishedVersion: meta?.publishedVersion,
    updatedAt: meta?.updatedAt,
    publishedAt: meta?.publishedAt,
    publishState: meta?.draftVersion != null ? "unpublished_changes" : "published",
    status: "published",
  });
}

/** shop_layout → CmsPage (version C: search + quick links, then layout sections). */
export function adaptShopLayoutToCmsPage(
  layout: ShopLayoutSettings,
  meta?: {
    draftVersion?: number;
    updatedAt?: string;
    homeSettings?: ShopHomeSettings | null;
  }
): CmsPage {
  const entry = getPageRegistryEntry("shop")!;
  const merged = mergeShopLayoutSettings(layout);
  const cmsBlocks: CmsBlock[] = [];

  cmsBlocks.push(
    blockFromLegacy("shop_search", 0, true, {}, "搜尋與熱門關鍵字")
  );
  cmsBlocks.push(
    blockFromLegacy("quick_links", 1, true, {}, "快捷入口")
  );

  merged.sectionOrder.forEach((id) => {
    if (id === "hero") return;
    cmsBlocks.push(
      blockFromLegacy(
        id,
        cmsBlocks.length,
        merged.sections[id] !== false,
        {},
        SHOP_LAYOUT_SECTION_LABELS[id] ?? id
      )
    );
  });

  const featured = meta?.homeSettings?.product_blocks?.featured;
  if (featured) {
    cmsBlocks.push(
      blockFromLegacy(
        "featured",
        cmsBlocks.length,
        featured.visible !== false,
        { title: featured.title, limit: featured.limit },
        featured.title || "精選商品"
      )
    );
  }

  return registryEntryToCmsPage(entry, {
    blocks: cmsBlocks,
    blockCount: cmsBlocks.length,
    settings: { seo: {} },
    draftVersion: meta?.draftVersion,
    updatedAt: meta?.updatedAt,
    publishState: meta?.draftVersion != null ? "unpublished_changes" : "published",
    status: "published",
  });
}

/** group_buy_page settings → CmsPage */
export function adaptGroupBuySettingsToCmsPage(
  settings: GroupBuyPageSettings,
  meta?: { draftVersion?: number; updatedAt?: string }
): CmsPage {
  const entry = getPageRegistryEntry("group_buy")!;
  const order = settings.sectionOrder?.length
    ? settings.sectionOrder
    : (Object.keys(settings.sections) as (keyof typeof settings.sections)[]);
  const cmsBlocks = order.map((id, i) =>
    blockFromLegacy(
      id,
      i,
      settings.sections[id] !== false,
      {
        title: settings.sectionTitles?.[id],
        subtitle: settings.sectionSubtitles?.[id],
      },
      settings.sectionTitles?.[id] || GROUP_BUY_SECTION_LABELS[id] || id
    )
  );
  return registryEntryToCmsPage(entry, {
    blocks: cmsBlocks,
    blockCount: cmsBlocks.length,
    draftVersion: meta?.draftVersion,
    updatedAt: meta?.updatedAt,
    publishState: meta?.draftVersion != null ? "unpublished_changes" : "published",
    status: settings.enabled === false ? "disabled" : "published",
    settings: {
      seo: {
        title: settings.title,
        description: settings.subtitle,
      },
    },
  });
}

/** Empty / unset page from registry */
export function adaptUnsetPage(pageId: string): CmsPage {
  const entry = getPageRegistryEntry(pageId);
  if (!entry) {
    return {
      id: pageId,
      name: pageId,
      slug: pageId,
      pageType: "custom",
      status: "unset",
      blocks: [],
      settings: {},
      publishState: "unset",
      blockCount: 0,
    };
  }
  return registryEntryToCmsPage(entry, {
    blocks: [],
    blockCount: 0,
    publishState: "unset",
    status: "unset",
  });
}

/** Recipes page — hero-only stub from settings blob */
export function adaptRecipesPageSettings(
  value: unknown,
  meta?: { updatedAt?: string }
): CmsPage {
  const entry = getPageRegistryEntry("recipes")!;
  const raw =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const hero =
    raw.hero && typeof raw.hero === "object"
      ? (raw.hero as Record<string, unknown>)
      : {};
  const blocks = [
    blockFromLegacy("hero", 0, true, { hero }, "食譜頁 Hero"),
  ];
  return registryEntryToCmsPage(entry, {
    blocks,
    blockCount: 1,
    updatedAt: meta?.updatedAt,
    publishState: "published",
    status: "published",
  });
}
