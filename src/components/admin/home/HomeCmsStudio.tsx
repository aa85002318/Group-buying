"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import { HomeHeroEditor } from "@/components/admin/home/HomeHeroEditor";
import { LatestCampaignEditor } from "@/components/admin/home/LatestCampaignEditor";
import { QuickServicesEditor } from "@/components/admin/home/QuickServicesEditor";
import { RecipePickerEditor } from "@/components/admin/home/RecipePickerEditor";
import { CategoryMenuEditor } from "@/components/admin/home/CategoryMenuEditor";
import { ServiceShortcutsEditor } from "@/components/admin/home/ServiceShortcutsEditor";
import { ExternalSourcePanel } from "@/components/admin/home/ExternalSourcePanel";
import { CmsImageField, CMS_IMAGE_SPECS } from "@/components/admin/home/CmsImageField";
import { CmsLinkPicker, cmsLinkFromHref, hrefFromCmsLink } from "@/components/admin/home/CmsLinkPicker";
import {
  CmsLivePreview,
  CmsSectionList,
  CmsSettingsPanel,
  CmsStudioHeader,
  CmsStudioShell,
  CmsVersionPublishBar,
  CmsWorkflowSteps,
  type CmsDevice,
  type CmsSaveStatus,
} from "@/components/admin/cms-studio";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HOME_ADMIN_SECTIONS,
  getSectionMeta,
  type HomeAdminSectionMeta,
} from "@/lib/home/admin-sections";
import { parseCategoryMenu, type HomeCategoryMenuItem } from "@/lib/home/category-menu";
import { parseServiceShortcuts, type ServiceShortcutItem } from "@/lib/home/service-shortcuts";
import {
  HOME_SECTION_SORT_DEFAULT,
  isSingletonHomeSection,
  PRIMARY_HOME_SECTION_KEYS,
  type HomeSectionKey,
} from "@/lib/home/section-keys";
import type { HomepageBlock } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import {
  DEFAULT_GROUP_BUY_BANNER_SETTINGS,
  parseGroupBuyBannerSettings,
  type HomeGroupBuyBannerSettings,
} from "@/types/home-group-buy-banner";
import {
  DEFAULT_LATEST_CAMPAIGN_SETTINGS,
  parseLatestCampaignSettings,
  type HomeLatestCampaignSettings,
} from "@/types/home-latest-campaign";
import {
  DEFAULT_QUICK_SERVICES_SETTINGS,
  parseQuickServicesSettings,
  type HomeQuickServicesSettings,
} from "@/types/home-quick-service";

/** System blocks: hide only, no hard delete of underlying capability. */
const FIXED_FUNCTION_KEYS = new Set<HomeSectionKey>([
  "latest_recipes",
  "ingredient_shop",
  "weekly_group_buys",
  "closing_group_buys",
  "weekly_live_streams",
  "chime_select",
  "quick_entry",
  "hero",
  "service_shortcuts",
]);

const PRIMARY_KEY_SET = new Set<string>(PRIMARY_HOME_SECTION_KEYS);

function primaryRank(blockKey: string): number {
  const idx = PRIMARY_HOME_SECTION_KEYS.indexOf(blockKey as HomeSectionKey);
  return idx >= 0 ? idx : 999;
}

/** Sort like the live homepage: primary stack by sort_order, then legacy. */
function sortBlocksLikeHomepage(blocks: HomepageBlock[]): HomepageBlock[] {
  return [...blocks].sort((a, b) => {
    const aPrimary = PRIMARY_KEY_SET.has(a.block_key);
    const bPrimary = PRIMARY_KEY_SET.has(b.block_key);
    if (aPrimary !== bPrimary) {
      return aPrimary ? -1 : 1;
    }
    const bySort = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (bySort !== 0) return bySort;
    return primaryRank(a.block_key) - primaryRank(b.block_key);
  });
}

export function HomeCmsStudio() {
  const [blocks, setBlocks] = useState<HomepageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<CmsDevice>("mobile");
  const [previewKey, setPreviewKey] = useState(0);
  const [dirtyHint, setDirtyHint] = useState(false);
  const [mobileTab, setMobileTab] = useState<"sections" | "edit" | "preview">("sections");
  const [saveStatus, setSaveStatus] = useState<CmsSaveStatus>("idle");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/cms?source=draft")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setBlocks(d.blocks ?? []);
        setDirtyHint(false);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get("section");
    if (!section) return;
    const match = blocks.find((b) => b.block_key === section || b.id === section);
    if (match) setExpanded(match.id);
  }, [blocks]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyHint) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyHint]);

  const patch = async (id: string, updates: Record<string, unknown>) => {
    setSavingId(id);
    setDirtyHint(true);
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "block", id, target: "draft", ...updates }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      await load();
      setPreviewKey((k) => k + 1);
      setSaveStatus("saved");
    } catch (e) {
      setSaveStatus("error");
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSavingId(null);
    }
  };

  const reorderPrimary = async (orderedIds: string[]) => {
    setSaveStatus("saving");
    setDirtyHint(true);
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i]!;
        const sort_order = (i + 1) * 10;
        const res = await fetch("/api/admin/cms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "block", id, target: "draft", sort_order }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "排序失敗");
      }
      await load();
      setPreviewKey((k) => k + 1);
      setSaveStatus("saved");
    } catch (e) {
      setSaveStatus("error");
      alert(e instanceof Error ? e.message : "排序失敗");
    }
  };

  const moveSection = async (block: HomepageBlock, dir: -1 | 1) => {
    const ordered = sortBlocksLikeHomepage(blocks);
    const idx = ordered.findIndex((b) => b.id === block.id);
    const swap = ordered[idx + dir];
    if (!swap) return;
    // Keep primary keys on canonical sort slots when both are primary
    const aKey = block.block_key as HomeSectionKey;
    const bKey = swap.block_key as HomeSectionKey;
    if (PRIMARY_KEY_SET.has(aKey) && PRIMARY_KEY_SET.has(bKey)) {
      await patch(block.id, {
        sort_order: HOME_SECTION_SORT_DEFAULT[bKey] ?? swap.sort_order,
      });
      await patch(swap.id, {
        sort_order: HOME_SECTION_SORT_DEFAULT[aKey] ?? block.sort_order,
      });
      return;
    }
    await patch(block.id, { sort_order: swap.sort_order });
    await patch(swap.id, { sort_order: block.sort_order });
  };

  const syncPrimaryOrder = async () => {
    if (
      !confirm(
        "將後台草稿重建為目前前台核心版型（11 個區塊），並移除舊區塊？\n重建後請記得「發布更新」才會上線。"
      )
    ) {
      return;
    }
    setCatalogBusy(true);
    try {
      const res = await fetch("/api/admin/home/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rebuild_primary_layout" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "重建失敗");
      await load();
      setPreviewKey((k) => k + 1);
      setDirtyHint(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "重建失敗");
    } finally {
      setCatalogBusy(false);
    }
  };

  const addBlock = async (blockKey: HomeSectionKey) => {
    setCatalogBusy(true);
    try {
      const res = await fetch("/api/admin/home/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_block", block_key: blockKey }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "加入失敗");
      setShowCatalog(false);
      setExpanded(d.block?.id ?? null);
      await load();
      setPreviewKey((k) => k + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "加入失敗");
    } finally {
      setCatalogBusy(false);
    }
  };

  const removeBlock = async (block: HomepageBlock) => {
    const key = block.block_key as HomeSectionKey;
    if (FIXED_FUNCTION_KEYS.has(key)) {
      alert("此為系統功能區塊，請改為「隱藏」，不可刪除底層功能。");
      return;
    }
    const meta = getSectionMeta(block.block_key);
    if (
      !confirm(
        `確定從草稿移除「${block.instance_label || block.title || meta?.label || block.block_key}」？`
      )
    ) {
      return;
    }
    setSavingId(block.id);
    try {
      const res = await fetch("/api/admin/home/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_block", block_id: block.id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "刪除失敗");
      await load();
      setPreviewKey((k) => k + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "刪除失敗");
    } finally {
      setSavingId(null);
    }
  };

  const orderedBlocks = useMemo(() => sortBlocksLikeHomepage(blocks), [blocks]);
  const primaryBlocks = useMemo(
    () => orderedBlocks.filter((b) => PRIMARY_KEY_SET.has(b.block_key)),
    [orderedBlocks]
  );
  const legacyBlocks = useMemo(
    () => orderedBlocks.filter((b) => !PRIMARY_KEY_SET.has(b.block_key)),
    [orderedBlocks]
  );

  const catalogItems = HOME_ADMIN_SECTIONS.filter((s) => {
    if (s.catalog === false) return false;
    if (isSingletonHomeSection(s.id) && blocks.some((b) => b.block_key === s.id)) {
      return false;
    }
    return true;
  });

  const previewSrc = `/admin/home/preview?embed=1&v=${previewKey}&device=${previewDevice === "desktop" ? "desktop" : "mobile"}`;

  const listItems = useMemo(() => {
    const presentKeys = new Set(primaryBlocks.map((b) => b.block_key));
    const items = primaryBlocks.map((block, index) => {
      const meta = getSectionMeta(block.block_key);
      return {
        id: block.id,
        label: `${index + 1}. ${meta?.label || block.title || block.block_key}`,
        enabled: Boolean(block.is_visible),
      };
    });
    for (const key of PRIMARY_HOME_SECTION_KEYS) {
      if (presentKeys.has(key)) continue;
      const meta = getSectionMeta(key);
      items.push({
        id: `missing-${key}`,
        label: `${meta?.label || key}`,
        enabled: false,
        subtitle: "草稿尚未加入",
      } as { id: string; label: string; enabled: boolean; subtitle?: string });
    }
    return items;
  }, [primaryBlocks]);

  const selectedBlock = useMemo(() => {
    if (!expanded) return null;
    return blocks.find((b) => b.id === expanded) ?? null;
  }, [blocks, expanded]);

  const selectedMeta = selectedBlock
    ? getSectionMeta(selectedBlock.block_key) ||
      ({
        id: selectedBlock.block_key as HomeSectionKey,
        label: selectedBlock.title || selectedBlock.block_key,
        description: "",
        contentMode: "manual",
      } as HomeAdminSectionMeta)
    : null;

  const selectSection = (id: string) => {
    if (id.startsWith("missing-")) {
      const key = id.replace("missing-", "") as HomeSectionKey;
      void addBlock(key);
      return;
    }
    setExpanded(id);
    setMobileTab("edit");
  };

  return (
    <CmsStudioShell
      mobileTab={mobileTab}
      onMobileTabChange={setMobileTab}
      header={
        <div className="space-y-3">
          <CmsStudioHeader
            title="首頁 CMS"
            description="拖拉排序核心區塊，右側預覽草稿。AI 頁（/ai）Hero 為靜態素材，搜尋與頁首部分沿用首頁 Hero 設定。"
            status={dirtyHint ? (saveStatus === "saving" ? "saving" : "dirty") : saveStatus}
            notice={
              <div className="space-y-2">
                <CmsWorkflowSteps
                  active={
                    mobileTab === "preview"
                      ? "preview"
                      : mobileTab === "edit"
                        ? "edit"
                        : "list"
                  }
                />
                <p className="rounded-lg border border-[#FFE149]/60 bg-[#FFFBEA] px-3 py-2 text-xs text-[#153E73]">
                  提示：商城 AI 卡（/admin/shop/ai-assistant）僅管理商城內卡片，不是 /ai 頁 CMS。
                </p>
              </div>
            }
          />
          <CmsVersionPublishBar
            apiPath="/api/admin/home/layout"
            title="首頁草稿與發布"
            description="區塊變更先寫入草稿，發布或排程後才會影響前台。"
            previewHref="/?preview=draft"
            publishConfirm="確定發布草稿到線上首頁？"
            onChanged={() => {
              load();
              setPreviewKey((k) => k + 1);
              setDirtyHint(false);
              setSaveStatus("published");
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={catalogBusy}
              onClick={() => void syncPrimaryOrder()}
            >
              重建為前台版型
            </Button>
            <Link
              href="/?preview=draft"
              target="_blank"
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              完整預覽草稿
            </Link>
          </div>
          {error ? (
            <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>
      }
      sectionList={
        <CmsSectionList
          title="首頁區塊"
          items={listItems}
          selectedId={expanded}
          onSelect={selectSection}
          onReorder={(ids) => {
            const real = ids.filter((id) => !id.startsWith("missing-"));
            void reorderPrimary(real);
          }}
          onToggleEnabled={(id) => {
            const block = blocks.find((b) => b.id === id);
            if (!block) return;
            void patch(block.id, { is_visible: !block.is_visible });
          }}
          onMove={(id, dir) => {
            const block = blocks.find((b) => b.id === id);
            if (!block) return;
            void moveSection(block, dir);
          }}
          headerExtra={
            <Button size="sm" variant="outline" onClick={() => setShowCatalog((v) => !v)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              新增
            </Button>
          }
          footer={
            <>
              {showCatalog ? (
                <div className="mb-2 max-h-36 space-y-1 overflow-y-auto rounded-lg bg-[#F7F8FA] p-2">
                  {catalogItems.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={catalogBusy}
                      className="flex w-full flex-col rounded-lg px-2 py-1.5 text-left hover:bg-white"
                      onClick={() => void addBlock(s.id)}
                    >
                      <span className="text-sm font-medium text-[#153E73]">{s.label}</span>
                      <span className="text-[11px] text-muted-foreground">{s.description}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {legacyBlocks.length ? (
                <p className="text-[11px] text-amber-800">
                  草稿仍有 {legacyBlocks.length} 個舊區塊，建議「重建為前台版型」。
                </p>
              ) : null}
            </>
          }
        />
      }
      settingsPanel={
        <CmsSettingsPanel
          title={selectedMeta?.label || "區塊設定"}
          subtitle={selectedMeta?.description}
          empty={
            loading ? (
              <p className="text-sm text-muted-foreground">載入中…</p>
            ) : (
              <p className="text-sm text-muted-foreground">請從左側選擇區塊進行編輯</p>
            )
          }
        >
          {selectedBlock && selectedMeta ? (
            <SectionPanel
              section={selectedMeta}
              block={selectedBlock}
              index={PRIMARY_HOME_SECTION_KEYS.indexOf(selectedBlock.block_key as HomeSectionKey)}
              open
              panelMode
              saving={savingId === selectedBlock.id}
              displayLabel={selectedMeta.label}
              onToggle={() => undefined}
              onPatch={patch}
              onMove={moveSection}
              onRemove={removeBlock}
              canDelete={!FIXED_FUNCTION_KEYS.has(selectedBlock.block_key as HomeSectionKey)}
            />
          ) : null}
        </CmsSettingsPanel>
      }
      preview={
        <CmsLivePreview
          title="首頁草稿預覽"
          src={previewSrc}
          reloadKey={previewKey}
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
          fullPreviewHref="/?preview=draft"
          highlightLabel={selectedMeta?.label}
        />
      }
      footer={
        <div className="flex flex-wrap gap-2 lg:hidden">
          <Button
            className="flex-1 border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73] hover:bg-[#FFE149]/90"
            onClick={() => {
              setSaveStatus("saved");
              setDirtyHint(false);
              void load();
            }}
          >
            儲存草稿
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setMobileTab("preview")}>
            預覽
          </Button>
        </div>
      }
    />
  );
}

function SectionPanel({
  section,
  block,
  index,
  open,
  saving,
  displayLabel,
  onToggle,
  onPatch,
  onMove,
  onRemove,
  canDelete,
  panelMode = false,
}: {
  section: HomeAdminSectionMeta;
  block: HomepageBlock;
  index: number;
  open: boolean;
  saving: boolean;
  displayLabel?: string;
  onToggle: () => void;
  onPatch: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onMove: (block: HomepageBlock, dir: -1 | 1) => Promise<void>;
  onRemove: (block: HomepageBlock) => Promise<void>;
  canDelete: boolean;
  panelMode?: boolean;
}) {
  const [title, setTitle] = useState(block.title ?? section.label);
  const [subtitle, setSubtitle] = useState(block.subtitle ?? "");
  const [displayCount, setDisplayCount] = useState(String(block.display_count ?? 6));
  const [viewAllUrl, setViewAllUrl] = useState(block.view_all_url ?? "");
  const [sourceMode, setSourceMode] = useState<"auto" | "manual">(
    block.source_mode === "manual" ? "manual" : "auto"
  );
  const [manualIds, setManualIds] = useState<string[]>(
    Array.isArray(block.manual_ids) ? block.manual_ids : []
  );
  const [campaigns, setCampaigns] = useState<HomeLatestCampaignSettings>(
    DEFAULT_LATEST_CAMPAIGN_SETTINGS
  );
  const [quick, setQuick] = useState<HomeQuickServicesSettings>(DEFAULT_QUICK_SERVICES_SETTINGS);
  const [shortcuts, setShortcuts] = useState<ServiceShortcutItem[]>([]);
  const [categoryMenu, setCategoryMenu] = useState<HomeCategoryMenuItem[]>([]);
  const [gbb, setGbb] = useState<HomeGroupBuyBannerSettings>(DEFAULT_GROUP_BUY_BANNER_SETTINGS);
  const [closingDays, setClosingDays] = useState("7");
  const [showCountdown, setShowCountdown] = useState(true);
  const [shopSource, setShopSource] = useState("automatic");
  const [shopSort, setShopSort] = useState("hot");
  const [moreCardLink, setMoreCardLink] = useState("/shop");

  useEffect(() => {
    setTitle(block.title ?? section.label);
    setSubtitle(block.subtitle ?? "");
    setDisplayCount(String(block.display_count ?? 6));
    setViewAllUrl(block.view_all_url ?? "");
    setSourceMode(block.source_mode === "manual" ? "manual" : "auto");
    setManualIds(Array.isArray(block.manual_ids) ? block.manual_ids! : []);
    if (section.hasLatestCampaignSettings) {
      setCampaigns(parseLatestCampaignSettings(block.config ?? null));
    }
    if (section.hasQuickServicesSettings) {
      setQuick(parseQuickServicesSettings(block.config ?? null));
    }
    if (section.hasServiceShortcutsSettings) {
      setShortcuts(parseServiceShortcuts(block.config ?? null));
    }
    if (section.hasCategoryMenu) {
      setCategoryMenu(parseCategoryMenu(block.config ?? null));
    }
    if (section.hasGroupBuyBannerSettings) {
      setGbb(parseGroupBuyBannerSettings(block.config ?? null));
    }
    if (section.hasExternalSourcePanel) {
      const cfg = block.config ?? {};
      setClosingDays(String(cfg.ending_within_days ?? cfg.closing_days ?? 7));
      setShowCountdown(cfg.show_countdown !== false);
    }
    if (section.hasIngredientShopSettings) {
      const cfg = block.config ?? {};
      setShopSource(String(cfg.product_source ?? "automatic"));
      setShopSort(String(cfg.sort_type ?? "hot"));
      setMoreCardLink(String(cfg.more_card_link ?? "/shop"));
    }
  }, [block, section]);

  const saveBasics = async () => {
    await onPatch(block.id, {
      title: title.trim() || section.label,
      subtitle: subtitle.trim() || null,
      display_count: Number(displayCount) || 6,
      view_all_url: viewAllUrl.trim() || null,
      source_mode: sourceMode,
    });
  };

  const cardTitle = displayLabel || section.label;

  return (
    <div className={cn(!panelMode && "overflow-hidden rounded-xl border border-border bg-white")}>
      {!panelMode ? (
      <div className="flex flex-wrap items-center gap-1.5 p-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-surface-soft text-[11px] font-bold text-caramel">
          {index + 1}
        </span>
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-coffee">{cardTitle}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {block.title && block.title !== cardTitle
              ? `前台標題：${block.title}`
              : section.description}
          </p>
        </button>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            block.is_visible ? "bg-success-soft text-success" : "bg-disabled-soft text-disabled"
          )}
        >
          {block.is_visible ? "顯示" : "隱藏"}
        </span>
        <Button size="sm" variant="outline" onClick={() => onMove(block, -1)} aria-label="上移">
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onMove(block, 1)} aria-label="下移">
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={saving}
          onClick={() => onPatch(block.id, { is_visible: !block.is_visible })}
        >
          {block.is_visible ? "隱藏" : "顯示"}
        </Button>
        <Button size="sm" variant="outline" onClick={onToggle}>
          {open ? "收合" : "設定"}
        </Button>
        {canDelete ? (
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => void onRemove(block)}
            aria-label="刪除區塊"
          >
            <Trash2 className="h-3.5 w-3.5 text-danger" />
          </Button>
        ) : null}
      </div>
      ) : (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold",
              block.is_visible ? "bg-success-soft text-success" : "bg-disabled-soft text-disabled"
            )}
          >
            {block.is_visible ? "顯示中" : "已隱藏"}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={saving}
            onClick={() => onPatch(block.id, { is_visible: !block.is_visible })}
          >
            {block.is_visible ? "隱藏區塊" : "顯示區塊"}
          </Button>
          {canDelete ? (
            <Button
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() => void onRemove(block)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5 text-danger" />
              移除
            </Button>
          ) : null}
        </div>
      )}

      {open ? (
        <div className={cn("space-y-3", !panelMode && "border-t border-border bg-surface-soft/30 p-3")}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-muted-foreground">區塊標題</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => void saveBasics()} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted-foreground">顯示數量</label>
              <Input
                type="number"
                value={displayCount}
                onChange={(e) => setDisplayCount(e.target.value)}
                onBlur={() => void saveBasics()}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] text-muted-foreground">副標</label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                onBlur={() => void saveBasics()}
              />
            </div>
            {(section.hasViewAllUrl || section.hasExternalSourcePanel) && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] text-muted-foreground">查看全部連結</label>
                <CmsLinkPicker
                  value={cmsLinkFromHref(viewAllUrl)}
                  onChange={(link) => {
                    const href = hrefFromCmsLink(link);
                    setViewAllUrl(href);
                    void onPatch(block.id, { view_all_url: href || null });
                  }}
                />
              </div>
            )}
          </div>

          {section.hasHeroEditor ? <HomeHeroEditor saving={saving} /> : null}

          {section.hasLatestCampaignSettings ? (
            <LatestCampaignEditor
              value={campaigns}
              onChange={setCampaigns}
              saving={saving}
              onSave={() =>
                void onPatch(block.id, {
                  title: campaigns.title || title,
                  view_all_url: campaigns.viewAllHref || viewAllUrl || null,
                  config: { ...(block.config ?? {}), ...campaigns },
                  is_visible: campaigns.enabled,
                })
              }
            />
          ) : null}

          {section.hasQuickServicesSettings ? (
            <QuickServicesEditor
              value={quick}
              onChange={setQuick}
              saving={saving}
              onSave={() =>
                void onPatch(block.id, {
                  title: quick.title || title,
                  config: { ...(block.config ?? {}), ...quick },
                  is_visible: quick.enabled !== false,
                })
              }
            />
          ) : null}

          {section.hasRecipePicker ? (
            <RecipePickerEditor
              manualIds={manualIds}
              sourceMode={sourceMode}
              onManualIdsChange={setManualIds}
              onSourceModeChange={setSourceMode}
              saving={saving}
              onSave={() =>
                void onPatch(block.id, {
                  manual_ids: manualIds,
                  source_mode: sourceMode,
                  display_count: Number(displayCount) || 8,
                })
              }
            />
          ) : null}

          {section.hasIngredientShopSettings ? (
            <div className="space-y-2 rounded-xl border border-border bg-white p-3">
              <p className="text-xs font-medium text-muted-foreground">
                商品由指定分類自動載入（不上架／不可買不顯示）。價格庫存請至商品管理。
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-muted-foreground">商品來源</label>
                  <select
                    className="input-field w-full"
                    value={shopSource}
                    onChange={(e) => setShopSource(e.target.value)}
                  >
                    <option value="automatic">自動</option>
                    <option value="category">依分類</option>
                    <option value="manual">手動選品</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-muted-foreground">排序</label>
                  <select
                    className="input-field w-full"
                    value={shopSort}
                    onChange={(e) => setShopSort(e.target.value)}
                  >
                    <option value="hot">熱門</option>
                    <option value="newest">最新</option>
                    <option value="sales">銷量</option>
                  </select>
                </div>
              </div>
              <Button
                size="sm"
                disabled={saving}
                onClick={() =>
                  void onPatch(block.id, {
                    config: {
                      ...(block.config ?? {}),
                      product_source: shopSource,
                      sort_type: shopSort,
                      more_card_link: moreCardLink,
                      category_menu: categoryMenu,
                    },
                  })
                }
              >
                儲存商品區設定
              </Button>
            </div>
          ) : null}

          {section.hasCategoryMenu ? (
            <CategoryMenuEditor
              items={categoryMenu}
              onChange={setCategoryMenu}
              saving={saving}
              hint={
                section.id === "chime_select"
                  ? "團購精選上方分類選單：可指定分類或團購篩選連結。"
                  : "一鍵買齊材料上方分類選單：指定現有商品分類連結。"
              }
              onSave={() =>
                void onPatch(block.id, {
                  config: { ...(block.config ?? {}), category_menu: categoryMenu },
                })
              }
            />
          ) : null}

          {section.hasGroupBuyBannerSettings ? (
            <GroupBuyBannerPanel
              value={gbb}
              onChange={setGbb}
              saving={saving}
              onSave={() =>
                void onPatch(block.id, {
                  config: { ...(block.config ?? {}), ...gbb },
                  is_visible: gbb.enabled,
                })
              }
            />
          ) : null}

          {section.hasExternalSourcePanel ? (
            <div className="space-y-2">
              <ExternalSourcePanel
                title="內容來源（不在此重複建立資料）"
                description={
                  section.id === "weekly_live_streams"
                    ? "直播封面、時段、狀態由直播管理帶入。此處只決定首頁如何顯示。"
                    : "團購活動由團購管理帶入。此處只決定標題、筆數與顯示條件。"
                }
                manageHref={
                  section.manageHref ||
                  (section.id === "weekly_live_streams"
                    ? "/admin/livestreams"
                    : "/admin/group-buy")
                }
                manageLabel={section.manageLabel || "前往管理"}
              />
              {(section.id === "closing_group_buys" ||
                section.id === "weekly_group_buys" ||
                section.id === "weekly_live_streams") && (
                <div className="grid gap-2 rounded-xl border border-border bg-white p-3 sm:grid-cols-2">
                  {section.id === "closing_group_buys" ? (
                    <div>
                      <label className="mb-1 block text-[11px] text-muted-foreground">
                        幾天內結單才顯示
                      </label>
                      <select
                        className="input-field w-full"
                        value={closingDays}
                        onChange={(e) => setClosingDays(e.target.value)}
                      >
                        {[1, 3, 5, 7].map((d) => (
                          <option key={d} value={d}>
                            {d} 天
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showCountdown}
                      onChange={(e) => setShowCountdown(e.target.checked)}
                    />
                    顯示倒數時間
                  </label>
                  <Button
                    size="sm"
                    className="sm:col-span-2"
                    disabled={saving}
                    onClick={() =>
                      void onPatch(block.id, {
                        config: {
                          ...(block.config ?? {}),
                          ending_within_days: Number(closingDays) || 7,
                          show_countdown: showCountdown,
                          subtitle: subtitle.trim() || null,
                        },
                        title: title.trim() || section.label,
                        display_count: Number(displayCount) || 8,
                        view_all_url: viewAllUrl.trim() || null,
                      })
                    }
                  >
                    儲存顯示條件
                  </Button>
                </div>
              )}
            </div>
          ) : null}

          {section.hasServiceShortcutsSettings ? (
            <ServiceShortcutsEditor
              items={shortcuts}
              onChange={setShortcuts}
              saving={saving}
              onSave={() =>
                void onPatch(block.id, {
                  config: { ...(block.config ?? {}), items: shortcuts },
                })
              }
            />
          ) : null}

          {!section.hasHeroEditor &&
          !section.hasLatestCampaignSettings &&
          !section.hasQuickServicesSettings &&
          !section.hasRecipePicker &&
          !section.hasIngredientShopSettings &&
          !section.hasGroupBuyBannerSettings &&
          !section.hasExternalSourcePanel &&
          !section.hasServiceShortcutsSettings ? (
            <p className="text-xs text-muted-foreground">
              此區塊以標題／顯示數量／顯示開關管理。內容來自既有模組。
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GroupBuyBannerPanel({
  value,
  onChange,
  onSave,
  saving,
}: {
  value: HomeGroupBuyBannerSettings;
  onChange: (next: HomeGroupBuyBannerSettings) => void;
  onSave: () => void;
  saving?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-white p-3">
      <p className="text-xs font-medium text-muted-foreground">
        團購輪播 Banner — 請標示上傳尺寸：桌面 1500×600（5:2）、手機 1080×900（6:5）。
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
        />
        啟用 Banner
      </label>
      <div>
        <label className="mb-1 block text-[11px] text-muted-foreground">輪播毫秒（0＝關）</label>
        <Input
          type="number"
          value={value.autoPlayMs}
          onChange={(e) => onChange({ ...value, autoPlayMs: Number(e.target.value) || 0 })}
        />
      </div>
      {value.slides.map((slide, index) => (
        <div key={slide.id} className="space-y-2 rounded-lg border border-border/70 p-2">
          <div className="flex justify-between">
            <p className="text-xs font-semibold">輪播 {index + 1}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({ ...value, slides: value.slides.filter((_, i) => i !== index) })
              }
            >
              <Trash2 className="h-3.5 w-3.5 text-danger" />
            </Button>
          </div>
          <Input
            value={slide.title}
            onChange={(e) => {
              const slides = [...value.slides];
              slides[index] = { ...slide, title: e.target.value };
              onChange({ ...value, slides });
            }}
            placeholder="標題"
          />
          <CmsLinkPicker
            value={cmsLinkFromHref(slide.href)}
            onChange={(link) => {
              const slides = [...value.slides];
              slides[index] = { ...slide, href: hrefFromCmsLink(link) };
              onChange({ ...value, slides });
            }}
          />
          <CmsImageField
            deviceLabel="桌面版"
            spec={CMS_IMAGE_SPECS.groupBuyDesktop}
            value={slide.imageUrl}
            onChange={(url) => {
              const slides = [...value.slides];
              slides[index] = { ...slide, imageUrl: url ?? "" };
              onChange({ ...value, slides });
            }}
            uploadFolder="home/group-buy-banner"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={slide.enabled !== false}
              onChange={(e) => {
                const slides = [...value.slides];
                slides[index] = { ...slide, enabled: e.target.checked };
                onChange({ ...value, slides });
              }}
            />
            顯示
          </label>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({
              ...value,
              slides: [
                ...value.slides,
                {
                  id: `gbb-${Date.now()}`,
                  title: "新 Banner",
                  imageUrl: "",
                  href: "/group-buy",
                  enabled: true,
                  sortOrder: (value.slides.length + 1) * 10,
                },
              ],
            })
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          新增輪播圖
        </Button>
        <Button type="button" size="sm" disabled={saving} onClick={onSave}>
          儲存團購 Banner
        </Button>
      </div>
    </div>
  );
}

