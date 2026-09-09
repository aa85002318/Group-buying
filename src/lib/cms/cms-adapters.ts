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

/**
 * CmsPage → homepage_blocks-shaped payload for draft save.
 * Preserves db_id when present so live upsert can match rows.
 */
export function cmsPageToHomeBlocks(page: CmsPage): HomepageBlock[] {
  return [...page.blocks]
    .sort((a, b) => a.order - b.order)
    .map((b, index) => {
      const settings = b.settings ?? {};
      const legacyKey = String(
        b.sourceKey || settings.legacyKey || b.type || `block_${index}`
      );
      const dbId =
        typeof settings.db_id === "string" && settings.db_id
          ? settings.db_id
          : undefined;
      return {
        id: dbId ?? crypto.randomUUID(),
        block_key: legacyKey,
        title: typeof settings.title === "string" ? settings.title : b.name,
        subtitle: typeof settings.subtitle === "string" ? settings.subtitle : null,
        sort_order: index + 1,
        display_count:
          typeof settings.display_count === "number" ? settings.display_count : null,
        is_visible: b.enabled !== false,
        source_mode:
          typeof settings.source_mode === "string" ? settings.source_mode : null,
        data_source:
          typeof settings.data_source === "string" ? settings.data_source : null,
        view_all_url:
          typeof settings.view_all_url === "string" ? settings.view_all_url : null,
        manual_ids: Array.isArray(settings.manual_ids) ? settings.manual_ids : null,
        config:
          settings.config && typeof settings.config === "object"
            ? settings.config
            : {},
        instance_label:
          typeof settings.instance_label === "string"
            ? settings.instance_label
            : null,
        updated_at: new Date().toISOString(),
      } as HomepageBlock;
    });
}

/** page_layout_settings rows → CmsPage (Desktop UI layout). */
export function adaptDesktopLayoutToCmsPage(
  rows: Array<{
    id: string;
    page_key: string;
    section_key: string;
    enabled: boolean;
    sort_order: number;
    layout_type?: string | null;
    columns?: number | null;
    display_limit?: number | null;
    settings_json?: Record<string, unknown> | null;
  }>,
  pageId: string,
  meta?: { draftVersion?: number; updatedAt?: string }
): CmsPage {
  const entry = getPageRegistryEntry(pageId) ?? getPageRegistryEntry("home")!;
  const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);
  const blocks = sorted.map((row, i) => {
    const title =
      (row.settings_json && typeof row.settings_json.title === "string"
        ? row.settings_json.title
        : null) || row.section_key;
    const type = resolveBlockTypeFromLegacyKey(row.section_key);
    return {
      id: row.id,
      type,
      name: String(title),
      enabled: row.enabled !== false,
      order: i,
      settings: {
        db_id: row.id,
        legacyKey: row.section_key,
        layout_type: row.layout_type,
        columns: row.columns,
        display_limit: row.display_limit,
        ...(row.settings_json ?? {}),
      },
      sourceKey: row.section_key,
    } satisfies CmsBlock;
  });
  return registryEntryToCmsPage(entry, {
    blocks,
    blockCount: blocks.length,
    draftVersion: meta?.draftVersion,
    updatedAt: meta?.updatedAt,
    publishState: meta?.draftVersion != null ? "unpublished_changes" : "published",
    status: "published",
    name: `${entry.name}（Desktop）`,
  });
}

export function cmsPageToDesktopLayoutPatches(page: CmsPage) {
  return [...page.blocks]
    .sort((a, b) => a.order - b.order)
    .map((b, index) => {
      const settings = { ...(b.settings ?? {}) };
      const id = typeof settings.db_id === "string" ? settings.db_id : b.id;
      delete settings.db_id;
      delete settings.legacyKey;
      const columns = settings.columns;
      const display_limit = settings.display_limit;
      const layout_type = settings.layout_type;
      delete settings.columns;
      delete settings.display_limit;
      delete settings.layout_type;
      return {
        id,
        enabled: b.enabled !== false,
        sort_order: index + 1,
        columns: typeof columns === "number" ? columns : null,
        display_limit: typeof display_limit === "number" ? display_limit : null,
        layout_type: typeof layout_type === "string" ? layout_type : null,
        settings_json: settings,
        section_key: String(b.sourceKey || b.type),
      };
    });
}

/** CmsPage → shop layout draft snapshot (order + visibility). */
export function cmsPageToShopLayout(
  page: CmsPage,
  base?: ShopLayoutSettings
): ShopLayoutSettings {
  const merged = mergeShopLayoutSettings(base ?? {});
  const sections = { ...merged.sections };
  const order: string[] = [];

  for (const b of [...page.blocks].sort((a, b) => a.order - b.order)) {
    const key = String(b.sourceKey || b.settings?.legacyKey || "");
    if (
      !key ||
      key === "shop_search" ||
      key === "quick_links" ||
      key === "featured"
    ) {
      continue;
    }
    if (!(key in sections) && !(key in SHOP_LAYOUT_SECTION_LABELS)) continue;
    order.push(key);
    sections[key as keyof typeof sections] = b.enabled !== false;
  }

  return mergeShopLayoutSettings({
    ...merged,
    sections,
    sectionOrder: order.length ? order : merged.sectionOrder,
  });
}

/** CmsPage → group buy page settings (order + visibility + titles). */
export function cmsPageToGroupBuySettings(
  page: CmsPage,
  base?: GroupBuyPageSettings
): GroupBuyPageSettings {
  const sections = { ...(base?.sections ?? {}) } as GroupBuyPageSettings["sections"];
  const sectionTitles = { ...(base?.sectionTitles ?? {}) };
  const sectionSubtitles = { ...(base?.sectionSubtitles ?? {}) };
  const sectionOrder: string[] = [];

  for (const b of [...page.blocks].sort((a, b) => a.order - b.order)) {
    const key = String(b.sourceKey || b.settings?.legacyKey || "");
    if (!key) continue;
    sectionOrder.push(key);
    (sections as Record<string, boolean>)[key] = b.enabled !== false;
    if (typeof b.settings?.title === "string") {
      (sectionTitles as Record<string, string>)[key] = b.settings.title;
    } else if (b.name) {
      (sectionTitles as Record<string, string>)[key] = b.name;
    }
    if (typeof b.settings?.subtitle === "string") {
      (sectionSubtitles as Record<string, string>)[key] = b.settings.subtitle;
    }
  }

  return {
    ...(base ?? ({} as GroupBuyPageSettings)),
    sections,
    sectionTitles,
    sectionSubtitles,
    sectionOrder: sectionOrder as GroupBuyPageSettings["sectionOrder"],
    title: page.settings?.seo?.title ?? base?.title ?? "",
    subtitle: page.settings?.seo?.description ?? base?.subtitle,
    enabled: page.status !== "disabled",
  };
}
