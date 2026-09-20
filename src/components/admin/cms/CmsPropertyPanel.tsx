"use client";

import { useState } from "react";
import { LAYOUT_TYPE_LABELS } from "@/lib/cms/plain-labels";
import { HomeBlockContentEditor } from "@/components/admin/cms/HomeBlockContentEditor";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import type { CmsBlock } from "@/types/cms";
import { ImageUploader } from "@/components/admin/cms/ImageUploader";
import { LinkPicker } from "@/components/admin/cms/LinkPicker";
import {
  cmsLinkFromHref,
  hrefFromCmsLink,
  type CmsLinkValue,
} from "@/components/admin/home/CmsLinkPicker";
import { CMS_IMAGE_SPECS } from "@/components/admin/home/CmsImageField";
import { isPageUnified, type PageBuilderPlatform } from "@/lib/cms/page-builder";
import { cn } from "@/lib/utils";

const SHOP_HOME_CONTENT_HREF: Record<string, string> = {
  shop_search: "/admin/shop/home?tab=basic",
  hot_searches: "/admin/shop/home?tab=basic",
  quick_links: "/admin/shop/home?tab=quick-links",
  quick_entry: "/admin/shop/home?tab=quick-links",
  categories: "/admin/shop/home?tab=categories",
  promo: "/admin/shop/home?tab=banners",
  new: "/admin/shop/home?tab=products",
  popular: "/admin/shop/home?tab=products",
  sale: "/admin/shop/home?tab=products",
  bundle: "/admin/shop/home?tab=products",
  featured: "/admin/shop/home?tab=products",
};

type TabId = "content" | "layout" | "display" | "advanced";

type Props = {
  block: CmsBlock | null;
  pageId: string;
  platform: PageBuilderPlatform;
  onChange: (patch: Partial<CmsBlock>) => void;
  readOnly?: boolean;
};

function patchSettings(
  block: CmsBlock,
  onChange: Props["onChange"],
  patch: Record<string, unknown>
) {
  onChange({ settings: { ...block.settings, ...patch } });
}

/** homepage_blocks.config lives at settings.config (persisted by cmsPageToHomeBlocks). */
function blockConfig(block: CmsBlock): Record<string, unknown> {
  const cfg = block.settings.config;
  return cfg && typeof cfg === "object" ? (cfg as Record<string, unknown>) : {};
}

function patchConfig(
  block: CmsBlock,
  onChange: Props["onChange"],
  patch: Record<string, unknown>
) {
  onChange({ settings: { ...block.settings, config: { ...blockConfig(block), ...patch } } });
}

/** Unified home sections whose website layout is a card grid. */
const WEBSITE_COLUMN_KEYS = new Set([
  "quick_entry",
  "latest_campaigns",
  "latest_recipes",
  "ingredient_shop",
]);

export function CmsPropertyPanel({
  block,
  pageId,
  platform,
  onChange,
  readOnly,
}: Props) {
  const [tab, setTab] = useState<TabId>("content");
  const isDesktop = platform === "desktop";
  const unified = isPageUnified(pageId) && platform === "mobile";

  if (!block) {
    return (
      <div className="flex h-full flex-col p-4">
        <p className="text-sm font-bold text-[#153E73]">區塊設定</p>
        <p className="mt-3 text-sm text-[#8A94A6]">
          從左側選取區塊後，在此編輯內容與版型。
        </p>
      </div>
    );
  }

  const sharedImage =
    (block.settings.image_url as string | undefined) ||
    (block.settings.shared_image_url as string | undefined) ||
    null;
  const desktopImage =
    (block.settings.desktop_image_url as string | undefined) ||
    (block.settings.desktop_image as string | undefined) ||
    null;
  const mobileImage =
    (block.settings.mobile_image_url as string | undefined) ||
    (block.settings.mobile_image as string | undefined) ||
    null;
  const linkHref = (block.settings.link_href as string | undefined) || "";
  const linkValue = cmsLinkFromHref(linkHref);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "content", label: "內容" },
    { id: "layout", label: "版型" },
    { id: "display", label: "顯示" },
    { id: "advanced", label: "進階" },
  ].filter((t) => !(unified && t.id === "advanced")) as Array<{ id: TabId; label: string }>;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-[#E9EDF2] p-3">
        <p className="truncate text-sm font-bold text-[#153E73]">{block.name}</p>
        <p className="mt-1 text-[11px] text-[#687386]">
          文字與圖片網頁版、手機版共用；排列方式只影響
          <span className="font-semibold text-[#153E73]">{isDesktop ? "網頁版" : "手機版"}</span>
        </p>
      </div>

      <div className="flex gap-0.5 border-b border-[#E9EDF2] px-2 pt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-t-[8px] px-1 py-2 text-[11px] font-semibold",
              tab === t.id
                ? "bg-[#FFF9E0] text-[#153E73]"
                : "text-[#8A94A6] hover:bg-[#F7F8FA]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {tab === "content" && unified ? (
          <HomeBlockContentEditor block={block} onChange={onChange} readOnly={readOnly} />
        ) : null}

        {tab === "content" && !unified ? (
          <>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">區塊名稱</span>
              <Input
                value={block.name}
                disabled={readOnly}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">標題</span>
              <Input
                value={String(block.settings.title ?? "")}
                disabled={readOnly}
                onChange={(e) =>
                  patchSettings(block, onChange, { title: e.target.value })
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">副標</span>
              <Input
                value={String(block.settings.subtitle ?? "")}
                disabled={readOnly}
                onChange={(e) =>
                  patchSettings(block, onChange, { subtitle: e.target.value })
                }
              />
            </label>

            <ImageUploader
              label="共用圖片"
              value={sharedImage}
              disabled={readOnly}
              spec={CMS_IMAGE_SPECS.campaignWide}
              onChange={(url) =>
                patchSettings(block, onChange, {
                  image_url: url,
                  shared_image_url: url,
                })
              }
            />

            {isDesktop ? (
              <ImageUploader
                label="網頁版專用圖片（選填）"
                value={desktopImage}
                disabled={readOnly}
                spec={CMS_IMAGE_SPECS.campaignWide}
                onChange={(url) =>
                  patchSettings(block, onChange, {
                    desktop_image_url: url,
                    desktop_image: url,
                  })
                }
              />
            ) : (
              <ImageUploader
                label="手機版專用圖片（選填）"
                value={mobileImage}
                disabled={readOnly}
                spec={CMS_IMAGE_SPECS.campaignWide}
                onChange={(url) =>
                  patchSettings(block, onChange, {
                    mobile_image_url: url,
                    mobile_image: url,
                  })
                }
              />
            )}

            <div>
              <p className="mb-1 text-xs font-medium text-[#153E73]">連結</p>
              <LinkPicker
                value={linkValue}
                disabled={readOnly}
                onChange={(next: CmsLinkValue) =>
                  patchSettings(block, onChange, {
                    link_href: hrefFromCmsLink(next),
                    link: next,
                  })
                }
              />
            </div>

            <p className="rounded-[10px] bg-[#EEF8FC] px-2.5 py-2 text-[11px] text-[#153E73]">
              🔗 共用內容資料 · 與另一版共用來源；此管道只改版型呈現。
            </p>

            {pageId === "shop" &&
            block.sourceKey &&
            SHOP_HOME_CONTENT_HREF[block.sourceKey] ? (
              <Link
                href={SHOP_HOME_CONTENT_HREF[block.sourceKey]!}
                className="inline-flex rounded-xl bg-[#FFD454] px-3 py-2 text-center text-sm font-bold text-[#153E73]"
              >
                編輯共用內容來源
              </Link>
            ) : null}
          </>
        ) : null}

        {tab === "layout" && unified ? (
          <UnifiedLayoutFields block={block} onChange={onChange} readOnly={readOnly} />
        ) : null}

        {tab === "layout" && !unified ? (
          <>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">
                {isDesktop ? "網頁版排列方式" : "手機版排列方式"}
              </span>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={readOnly}
                value={String(block.settings.layout_type ?? "")}
                onChange={(e) =>
                  patchSettings(block, onChange, {
                    layout_type: e.target.value || null,
                  })
                }
              >
                <option value="">預設</option>
                {isDesktop ? (
                  <>
                    <option value="grid">{LAYOUT_TYPE_LABELS.grid}</option>
                    <option value="carousel">{LAYOUT_TYPE_LABELS.carousel}</option>
                    <option value="list">{LAYOUT_TYPE_LABELS.list}</option>
                    <option value="1+2">{LAYOUT_TYPE_LABELS["1+2"]}</option>
                    <option value="sidebar">{LAYOUT_TYPE_LABELS.sidebar}</option>
                    <option value="full_width">{LAYOUT_TYPE_LABELS.full_width}</option>
                  </>
                ) : (
                  <>
                    <option value="carousel">{LAYOUT_TYPE_LABELS.carousel}</option>
                    <option value="1col">{LAYOUT_TYPE_LABELS["1col"]}</option>
                    <option value="2col">{LAYOUT_TYPE_LABELS["2col"]}</option>
                    <option value="peek">{LAYOUT_TYPE_LABELS.peek}</option>
                    <option value="bottom_sheet">{LAYOUT_TYPE_LABELS.bottom_sheet}</option>
                  </>
                )}
              </select>
            </label>

            {isDesktop ? (
              <label className="block space-y-1">
                <span className="text-xs font-medium text-[#153E73]">每列幾個</span>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  disabled={readOnly}
                  value={
                    typeof block.settings.columns === "number"
                      ? block.settings.columns
                      : ""
                  }
                  onChange={(e) =>
                    patchSettings(block, onChange, {
                      columns: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </label>
            ) : null}

            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">圖片比例</span>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={readOnly}
                value={String(block.settings.imageRatio ?? block.settings.heroRatio ?? "")}
                onChange={(e) =>
                  patchSettings(block, onChange, {
                    imageRatio: e.target.value || undefined,
                    heroRatio: e.target.value || undefined,
                  })
                }
              >
                <option value="">預設</option>
                <option value="16:9">16:9</option>
                <option value="5:2">5:2</option>
                <option value="4:3">4:3</option>
                <option value="1:1">1:1</option>
              </select>
            </label>
          </>
        ) : null}

        {tab === "display" ? (
          <>
            {unified ? (
              <UnifiedVisibilityFields block={block} onChange={onChange} readOnly={readOnly} />
            ) : (
              <label className="flex items-center gap-2 text-sm text-[#153E73]">
                <input
                  type="checkbox"
                  checked={block.enabled}
                  disabled={readOnly}
                  onChange={(e) => onChange({ enabled: e.target.checked })}
                />
                顯示此區塊（只影響{isDesktop ? "網頁版" : "手機版"}）
              </label>
            )}
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">最多顯示幾筆</span>
              <Input
                type="number"
                min={1}
                max={48}
                disabled={readOnly}
                value={
                  typeof block.settings.display_limit === "number"
                    ? block.settings.display_limit
                    : typeof block.settings.display_count === "number"
                      ? block.settings.display_count
                      : ""
                }
                onChange={(e) => {
                  const n = e.target.value ? Number(e.target.value) : null;
                  patchSettings(block, onChange, {
                    display_limit: n,
                    display_count: n,
                  });
                }}
              />
            </label>
            {!unified && (
              [
                ["showTitle", "顯示標題"],
                ["showViewAll", "顯示查看更多"],
                ["showPrice", "顯示價格"],
                ["showPrepTime", "顯示時間"],
                ["showDifficulty", "顯示難度"],
                ["showFavorite", "顯示收藏"],
                ["showAddToCart", "顯示加入購物車"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 text-sm text-[#153E73]"
              >
                <input
                  type="checkbox"
                  checked={Boolean(block.settings[key])}
                  disabled={readOnly}
                  onChange={(e) =>
                    patchSettings(block, onChange, { [key]: e.target.checked })
                  }
                />
                {label}
              </label>
            ))}
          </>
        ) : null}

        {tab === "advanced" ? (
          <>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">背景色</span>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={readOnly}
                value={String(block.settings.bgPreset ?? "default")}
                onChange={(e) =>
                  patchSettings(block, onChange, { bgPreset: e.target.value })
                }
              >
                <option value="default">預設</option>
                <option value="white">白色</option>
                <option value="warm">暖白</option>
                <option value="yellow">黃色</option>
                <option value="cream">奶油色</option>
                <option value="sky">淺藍</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">間距</span>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={readOnly}
                value={String(block.settings.spacingPreset ?? "medium")}
                onChange={(e) =>
                  patchSettings(block, onChange, {
                    spacingPreset: e.target.value,
                  })
                }
              >
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">圖片焦點</span>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={readOnly}
                value={String(block.settings.focusPosition ?? "center")}
                onChange={(e) =>
                  patchSettings(block, onChange, {
                    focusPosition: e.target.value,
                  })
                }
              >
                <option value="center">置中</option>
                <option value="left">靠左</option>
                <option value="right">靠右</option>
              </select>
            </label>
            {block.sourceKey ? (
              <p className="rounded-[10px] bg-[#F7F8FA] px-2.5 py-2 text-[11px] text-[#687386]">
                區塊代碼：{block.sourceKey}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function blockKey(block: CmsBlock): string {
  return String(block.sourceKey || block.settings.legacyKey || block.type || "");
}

/** 顯示 tab (unified home): one toggle per platform. */
function UnifiedVisibilityFields({
  block,
  onChange,
  readOnly,
}: {
  block: CmsBlock;
  onChange: Props["onChange"];
  readOnly?: boolean;
}) {
  const cfg = blockConfig(block);
  const websiteVisible =
    typeof cfg.desktop_visible === "boolean" ? cfg.desktop_visible : block.enabled;
  return (
    <div className="space-y-2 rounded-[10px] border border-[#E9EDF2] bg-[#FAFBFC] p-3">
      <p className="text-xs font-semibold text-[#153E73]">在哪裡顯示</p>
      <label className="flex items-center gap-2 text-sm text-[#153E73]">
        <input
          type="checkbox"
          checked={block.enabled}
          disabled={readOnly}
          onChange={(e) => {
            // Keep the website choice explicit so hiding on the app does not
            // silently hide the website too.
            onChange({
              enabled: e.target.checked,
              settings: {
                ...block.settings,
                config: { ...cfg, desktop_visible: websiteVisible },
              },
            });
          }}
        />
        手機 App
      </label>
      <label className="flex items-center gap-2 text-sm text-[#153E73]">
        <input
          type="checkbox"
          checked={websiteVisible}
          disabled={readOnly}
          onChange={(e) => patchConfig(block, onChange, { desktop_visible: e.target.checked })}
        />
        網站（電腦版）
      </label>
      <p className="text-[11px] leading-relaxed text-[#8A94A6]">
        標題、連結、挑選的商品與顯示筆數兩邊共用，改一次就好。
      </p>
    </div>
  );
}

/** 版型 tab (unified home): the app layout is fixed; website can change cards per row. */
function UnifiedLayoutFields({
  block,
  onChange,
  readOnly,
}: {
  block: CmsBlock;
  onChange: Props["onChange"];
  readOnly?: boolean;
}) {
  const cfg = blockConfig(block);
  const key = blockKey(block);
  const cols = typeof cfg.desktop_columns === "number" ? cfg.desktop_columns : "";
  return (
    <div className="space-y-3">
      {WEBSITE_COLUMN_KEYS.has(key) ? (
        <label className="block space-y-1">
          <span className="text-xs font-medium text-[#153E73]">網站每列幾個</span>
          <Input
            type="number"
            min={1}
            max={8}
            placeholder="預設"
            disabled={readOnly}
            value={cols}
            onChange={(e) =>
              patchConfig(block, onChange, {
                desktop_columns: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
          <span className="block text-[11px] text-[#8A94A6]">留空 = 使用預設排列。</span>
        </label>
      ) : (
        <p className="text-sm text-[#687386]">這個區塊的網站版排列是固定的，沒有可調整的選項。</p>
      )}
      <p className="rounded-[10px] bg-[#F7F8FA] px-2.5 py-2 text-[11px] leading-relaxed text-[#687386]">
        手機 App 的排列方式由 App 版型決定；要改順序請在左側拖曳，兩邊會一起變。
      </p>
    </div>
  );
}
