"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adaptDesktopLayoutToCmsPage,
  adaptGroupBuySettingsToCmsPage,
  adaptHomeBlocksToCmsPage,
  adaptRecipesPageSettings,
  adaptShopLayoutToCmsPage,
  adaptUnsetPage,
  cmsPageToDesktopLayoutPatches,
  cmsPageToGroupBuySettings,
  cmsPageToHomeBlocks,
  cmsPageToShopLayout,
} from "@/lib/cms/cms-adapters";
import {
  PAGE_BUILDER_BASE,
  PAGE_BUILDER_DESKTOP_KEY,
  PAGE_BUILDER_DESKTOP_WIRABLE,
  PAGE_BUILDER_MOBILE_WIRABLE,
} from "@/lib/cms/page-builder";
import { getPageRegistryEntry } from "@/lib/cms/page-registry";
import type { CmsDevice, CmsPage } from "@/types/cms";
import { CmsEditorShell } from "@/components/admin/cms/CmsEditorShell";
import type { CmsVersionLite } from "@/components/admin/cms/CmsVersionHistoryPanel";
import type { HomepageBlock } from "@/lib/types/database";
import type { ShopLayoutSettings } from "@/lib/shop/layout-settings";
import type { GroupBuyPageSettings } from "@/lib/group-buy/page-settings";
import type { PageLayoutSetting } from "@/lib/layout/page-layout-settings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Monitor, Smartphone } from "lucide-react";

const LEGACY_HREF: Record<string, string> = {
  home: "/admin/home",
  shop: "/admin/shop/home",
  group_buy: "/admin/group-buy/settings",
  recipes: "/admin/recipes/settings",
  global_header: "/admin/header-promos",
  global_side_menu: "/admin/side-menu",
  global_footer: "/admin/layout-settings/desktop/footer",
};

type Platform = "mobile" | "desktop";

/**
 * Dual-platform Page Builder loader.
 * Mobile: existing home/shop/group-buy draft APIs.
 * Desktop: page_layout_settings via /api/admin/desktop-layout.
 */
export function CmsCanvasPageLoader({
  pageId,
  hubHref = PAGE_BUILDER_BASE,
}: {
  pageId: string;
  hubHref?: string;
}) {
  const entry = getPageRegistryEntry(pageId);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [page, setPage] = useState<CmsPage | null>(null);
  const [versions, setVersions] = useState<CmsVersionLite[]>([]);
  const [shopBase, setShopBase] = useState<ShopLayoutSettings | null>(null);
  const [groupBuyBase, setGroupBuyBase] = useState<GroupBuyPageSettings | null>(
    null
  );
  const [desktopRows, setDesktopRows] = useState<PageLayoutSetting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const desktopKey = PAGE_BUILDER_DESKTOP_KEY[pageId] ?? pageId;
  const mobileWirable = PAGE_BUILDER_MOBILE_WIRABLE.has(pageId);
  const desktopWirable = PAGE_BUILDER_DESKTOP_WIRABLE.has(pageId);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (platform === "desktop" && desktopWirable) {
        const res = await fetch(
          `/api/admin/desktop-layout?page_key=${encodeURIComponent(desktopKey)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Desktop 載入失敗");
        const rows = (data.draft?.rows ?? []) as PageLayoutSetting[];
        setDesktopRows(rows);
        setPage(
          adaptDesktopLayoutToCmsPage(rows, pageId, {
            draftVersion: data.draft?.version_number,
            updatedAt: data.draft?.updated_at,
          })
        );
        setVersions(
          ((data.versions ?? []) as Array<{
            id: string;
            version_number: number;
            updated_at: string;
            updated_by?: string | null;
          }>).map((v) => ({
            id: v.id,
            version_number: v.version_number,
            status: "published",
            label: `Desktop v${v.version_number}`,
            scheduled_at: null,
            published_at: v.updated_at,
            updated_at: v.updated_at,
          }))
        );
        return;
      }

      if (pageId === "home") {
        const [blocksRes, layoutRes] = await Promise.all([
          fetch("/api/admin/cms?type=blocks&source=draft"),
          fetch("/api/admin/home/layout"),
        ]);
        const data = await blocksRes.json();
        if (!blocksRes.ok) throw new Error(data.error ?? "載入失敗");
        const layout = layoutRes.ok ? await layoutRes.json() : {};
        setPage(
          adaptHomeBlocksToCmsPage((data.blocks ?? []) as HomepageBlock[], {
            draftVersion: layout.draft?.version_number ?? 1,
            updatedAt: layout.draft?.updated_at,
          })
        );
        setVersions((layout.versions ?? []) as CmsVersionLite[]);
        return;
      }

      if (pageId === "shop") {
        const [layoutRes, homeRes] = await Promise.all([
          fetch("/api/admin/shop/layout"),
          fetch("/api/admin/shop/home-settings"),
        ]);
        const data = await layoutRes.json();
        if (!layoutRes.ok) throw new Error(data.error ?? "載入失敗");
        const home = homeRes.ok ? await homeRes.json() : {};
        setShopBase(data.settings as ShopLayoutSettings);
        setPage(
          adaptShopLayoutToCmsPage(data.settings as ShopLayoutSettings, {
            draftVersion: data.draft?.version_number,
            updatedAt: data.draft?.updated_at,
            homeSettings: home.settings ?? null,
          })
        );
        setVersions((data.versions ?? []) as CmsVersionLite[]);
        return;
      }

      if (pageId === "group_buy") {
        const res = await fetch("/api/admin/group-buy/page-settings");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "載入失敗");
        setGroupBuyBase(data.settings as GroupBuyPageSettings);
        setPage(
          adaptGroupBuySettingsToCmsPage(data.settings as GroupBuyPageSettings, {
            draftVersion: data.draft?.version_number,
            updatedAt: data.draft?.updated_at,
          })
        );
        setVersions((data.versions ?? []) as CmsVersionLite[]);
        return;
      }

      if (pageId === "recipes") {
        setPage(adaptRecipesPageSettings({}, {}));
        setVersions([]);
        return;
      }

      setPage(adaptUnsetPage(pageId));
      setVersions([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
      setPage(adaptUnsetPage(pageId));
    } finally {
      setLoading(false);
    }
  }, [desktopKey, desktopWirable, pageId, platform]);

  useEffect(() => {
    void load();
  }, [load]);

  const defaultDevice: CmsDevice =
    platform === "desktop" ? "desktop" : "mobile";

  const canSave = useMemo(() => {
    if (platform === "desktop") return desktopWirable;
    return mobileWirable;
  }, [desktopWirable, mobileWirable, platform]);

  const onSaveDraft = useCallback(
    async (next: CmsPage) => {
      if (platform === "desktop" && desktopWirable) {
        const patches = cmsPageToDesktopLayoutPatches(next);
        const byId = new Map(desktopRows.map((r) => [r.id, r]));
        const rows: PageLayoutSetting[] = patches.map((p) => {
          const prev = byId.get(p.id);
          return {
            id: p.id,
            page_key: desktopKey,
            platform: "desktop",
            section_key: p.section_key,
            enabled: p.enabled,
            sort_order: p.sort_order,
            layout_type: p.layout_type ?? prev?.layout_type ?? null,
            columns: p.columns ?? prev?.columns ?? null,
            display_limit: p.display_limit ?? prev?.display_limit ?? null,
            settings_json: p.settings_json ?? {},
          };
        });
        const res = await fetch("/api/admin/desktop-layout", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_key: desktopKey, rows }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "儲存失敗");
        setDesktopRows(rows);
        await load();
        return;
      }

      if (pageId === "home") {
        const blocks = cmsPageToHomeBlocks(next);
        const res = await fetch("/api/admin/home/layout", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks, label: "Page Builder 草稿" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "儲存失敗");
        await load();
        return;
      }

      if (pageId === "shop") {
        const settings = cmsPageToShopLayout(next, shopBase ?? undefined);
        const res = await fetch("/api/admin/shop/layout", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "儲存失敗");
        await load();
        return;
      }

      if (pageId === "group_buy") {
        const settings = cmsPageToGroupBuySettings(
          next,
          groupBuyBase ?? undefined
        );
        const res = await fetch("/api/admin/group-buy/page-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "儲存失敗");
        await load();
        return;
      }

      throw new Error("此頁／版型尚未接上草稿 API");
    },
    [
      desktopKey,
      desktopRows,
      desktopWirable,
      groupBuyBase,
      load,
      pageId,
      platform,
      shopBase,
    ]
  );

  const onPublish = useCallback(
    async (next: CmsPage) => {
      await onSaveDraft(next);

      if (platform === "desktop" && desktopWirable) {
        const res = await fetch("/api/admin/desktop-layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "publish", page_key: desktopKey }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "發佈失敗");
        await load();
        return;
      }

      if (pageId === "home") {
        const res = await fetch("/api/admin/home/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "publish", label: "Page Builder 發佈" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "發佈失敗");
        await load();
        return;
      }

      if (pageId === "shop") {
        const res = await fetch("/api/admin/shop/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "publish" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "發佈失敗");
        await load();
        return;
      }

      if (pageId === "group_buy") {
        const res = await fetch("/api/admin/group-buy/page-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "publish" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "發佈失敗");
        await load();
        return;
      }

      throw new Error("此頁／版型尚未接上發佈 API");
    },
    [desktopKey, desktopWirable, load, onSaveDraft, pageId, platform]
  );

  const onRestoreVersion = useCallback(
    async (versionId: string) => {
      if (platform === "desktop" && desktopWirable) {
        const res = await fetch("/api/admin/desktop-layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "restore",
            page_key: desktopKey,
            version_id: versionId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "還原失敗");
        await load();
        return;
      }

      if (pageId === "home") {
        const res = await fetch("/api/admin/home/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restore", version_id: versionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "還原失敗");
        await load();
        return;
      }

      if (pageId === "shop") {
        const res = await fetch("/api/admin/shop/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restore", version_id: versionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "還原失敗");
        await load();
        return;
      }

      throw new Error("此頁尚不支援版本還原");
    },
    [desktopKey, desktopWirable, load, pageId, platform]
  );

  if (loading) {
    return <p className="p-6 text-sm text-[#8A94A6]">載入 Page Builder…</p>;
  }

  if (!page) {
    return <p className="p-6 text-sm text-[#B42318]">{error ?? "找不到頁面"}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[#E9EDF2] bg-white p-2">
        <span className="px-2 text-xs font-semibold text-[#687386]">版型</span>
        <Button
          type="button"
          size="sm"
          variant={platform === "desktop" ? "default" : "outline"}
          className={cn(
            platform === "desktop" &&
              "border-[#FFD454] bg-[#FFD454] text-[#153E73] hover:bg-[#FFD454]/90"
          )}
          onClick={() => setPlatform("desktop")}
        >
          <Monitor className="mr-1 h-3.5 w-3.5" />
          Desktop
        </Button>
        <Button
          type="button"
          size="sm"
          variant={platform === "mobile" ? "default" : "outline"}
          className={cn(
            platform === "mobile" &&
              "border-[#FFD454] bg-[#FFD454] text-[#153E73] hover:bg-[#FFD454]/90"
          )}
          onClick={() => setPlatform("mobile")}
        >
          <Smartphone className="mr-1 h-3.5 w-3.5" />
          Mobile
        </Button>
        <span className="ml-auto text-[11px] text-[#8A94A6]">
          {platform === "desktop"
            ? desktopWirable
              ? "編輯 Desktop 版型（共用內容資料）"
              : "Desktop 此頁尚為預留"
            : mobileWirable
              ? "編輯 Mobile／App 區塊（不改核心流程）"
              : "Mobile 此頁尚為預留；前台維持現況"}
        </span>
      </div>

      {error ? (
        <p className="rounded-[12px] bg-[#FDE8E6] px-3 py-2 text-sm text-[#B42318]">
          {error}（已顯示預留頁面）
        </p>
      ) : null}
      {!entry?.hasLayoutCms && platform === "mobile" ? (
        <p className="rounded-[12px] bg-[#FFF5CC] px-3 py-2 text-sm text-[#153E73]">
          此頁尚未有 Mobile 版型 CMS。畫布僅供規劃預留，不會寫入正式前台。
        </p>
      ) : null}
      {platform === "desktop" && !desktopWirable ? (
        <p className="rounded-[12px] bg-[#FFF5CC] px-3 py-2 text-sm text-[#153E73]">
          Desktop 此頁將於後續 Phase 接上。目前僅首頁／商城／食譜可存草稿與發佈。
        </p>
      ) : null}

      <CmsEditorShell
        key={`${pageId}-${platform}-${page.updatedAt ?? ""}-${page.draftVersion ?? 0}`}
        initialPage={page}
        initialDevice={defaultDevice}
        layoutVariant="split-preview"
        backHref={hubHref}
        legacyHref={LEGACY_HREF[pageId]}
        legacyLabel={pageId === "shop" ? "商城首頁設定" : undefined}
        readOnly={!canSave}
        allowLocalEdit={canSave}
        versions={versions}
        description={
          platform === "desktop"
            ? "Desktop 版型：排序／顯示／欄數。商品與食譜資料共用，不另建表。"
            : entry?.description ??
              "Mobile／App 區塊：內容資料共用；請用草稿→預覽→發佈。"
        }
        onSaveDraft={canSave ? onSaveDraft : undefined}
        onPublish={canSave ? onPublish : undefined}
        onRestoreVersion={
          canSave && versions.length > 0 ? onRestoreVersion : undefined
        }
      />
    </div>
  );
}
