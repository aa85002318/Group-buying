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
  PAGE_BUILDER_DESKTOP_WIRABLE,
  PAGE_BUILDER_GROUPS,
  PAGE_BUILDER_LAYOUT_KEY,
  PAGE_BUILDER_MOBILE_WIRABLE,
  isPageWirable,
  pageBuilderPlatformHref,
  type PageBuilderPlatform,
} from "@/lib/cms/page-builder";
import { getPageRegistryEntry } from "@/lib/cms/page-registry";
import type { CmsPage } from "@/types/cms";
import { CmsEditorShell } from "@/components/admin/cms/CmsEditorShell";
import type { CmsVersionLite } from "@/components/admin/cms/CmsVersionHistoryPanel";
import type { HomepageBlock } from "@/lib/types/database";
import type { ShopLayoutSettings } from "@/lib/shop/layout-settings";
import type { GroupBuyPageSettings } from "@/lib/group-buy/page-settings";
import type { PageLayoutSetting } from "@/lib/layout/page-layout-settings";

const LEGACY_HREF: Record<string, string> = {
  home: "/admin/home",
  shop: "/admin/shop/home",
  group_buy: "/admin/group-buy/settings",
  recipes: "/admin/recipes/settings",
  global_header: "/admin/header-promos",
  global_side_menu: "/admin/side-menu",
  global_footer: "/admin/layout-settings/desktop/footer",
};

/**
 * Fixed-platform Page Builder loader.
 * Desktop and Mobile are separate pipelines (separate URLs / publish scopes).
 */
export function CmsCanvasPageLoader({
  pageId,
  platform,
}: {
  pageId: string;
  platform: PageBuilderPlatform;
}) {
  const entry = getPageRegistryEntry(pageId);
  const [page, setPage] = useState<CmsPage | null>(null);
  const [versions, setVersions] = useState<CmsVersionLite[]>([]);
  const [shopBase, setShopBase] = useState<ShopLayoutSettings | null>(null);
  const [groupBuyBase, setGroupBuyBase] = useState<GroupBuyPageSettings | null>(
    null
  );
  const [layoutRows, setLayoutRows] = useState<PageLayoutSetting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const layoutKey = PAGE_BUILDER_LAYOUT_KEY[pageId] ?? pageId;
  const canSave = isPageWirable(pageId, platform);
  const hubHref = pageBuilderPlatformHref(platform);

  const pageOptions = useMemo(
    () =>
      PAGE_BUILDER_GROUPS.flatMap((g) =>
        g.pageIds
          .map((id) => getPageRegistryEntry(id))
          .filter(Boolean)
          .map((p) => ({ id: p!.id, name: p!.name }))
      ),
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (platform === "desktop" && PAGE_BUILDER_DESKTOP_WIRABLE.has(pageId)) {
        const res = await fetch(
          `/api/admin/desktop-layout?page_key=${encodeURIComponent(layoutKey)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Desktop 載入失敗");
        const rows = (data.draft?.rows ?? []) as PageLayoutSetting[];
        setLayoutRows(rows);
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
          }>).map((v) => ({
            id: v.id,
            version_number: v.version_number,
            status: "published",
            label: `Desktop v${v.version_number}`,
            published_at: v.updated_at,
            updated_at: v.updated_at,
          }))
        );
        return;
      }

      // Mobile pipeline (and desktop non-layout pages)
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
  }, [layoutKey, pageId, platform]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSaveDraft = useCallback(
    async (next: CmsPage) => {
      if (platform === "desktop" && PAGE_BUILDER_DESKTOP_WIRABLE.has(pageId)) {
        const patches = cmsPageToDesktopLayoutPatches(next);
        const byId = new Map(layoutRows.map((r) => [r.id, r]));
        const rows: PageLayoutSetting[] = patches.map((p) => {
          const prev = byId.get(p.id);
          return {
            id: p.id,
            page_key: layoutKey,
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
          body: JSON.stringify({ page_key: layoutKey, rows }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "儲存失敗");
        setLayoutRows(rows);
        await load();
        return;
      }

      if (pageId === "home") {
        const blocks = cmsPageToHomeBlocks(next);
        const res = await fetch("/api/admin/home/layout", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks, label: "Mobile Page Builder 草稿" }),
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

      throw new Error("此頁／管道尚未接上草稿 API");
    },
    [groupBuyBase, layoutKey, layoutRows, load, pageId, platform, shopBase]
  );

  const onPublish = useCallback(
    async (next: CmsPage) => {
      await onSaveDraft(next);

      if (platform === "desktop" && PAGE_BUILDER_DESKTOP_WIRABLE.has(pageId)) {
        const res = await fetch("/api/admin/desktop-layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "publish", page_key: layoutKey }),
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
          body: JSON.stringify({
            action: "publish",
            label: "Mobile Page Builder 發佈",
          }),
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

      throw new Error("此頁／管道尚未接上發佈 API");
    },
    [layoutKey, load, onSaveDraft, pageId, platform]
  );

  const onRestoreVersion = useCallback(
    async (versionId: string) => {
      if (platform === "desktop" && PAGE_BUILDER_DESKTOP_WIRABLE.has(pageId)) {
        const res = await fetch("/api/admin/desktop-layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "restore",
            page_key: layoutKey,
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
    [layoutKey, load, pageId, platform]
  );

  if (loading) {
    return <p className="p-6 text-sm text-[#8A94A6]">載入編輯器…</p>;
  }

  if (!page) {
    return <p className="p-6 text-sm text-[#B42318]">{error ?? "找不到頁面"}</p>;
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p className="rounded-[10px] bg-[#FDE8E6] px-3 py-2 text-sm text-[#B42318]">
          {error}
        </p>
      ) : null}
      {!canSave ? (
        <p className="rounded-[10px] bg-[#FFF5CC] px-3 py-2 text-sm text-[#153E73]">
          {platform === "desktop"
            ? "Desktop 此頁尚為預留。目前可編輯：首頁／商城／食譜。"
            : "Mobile 此頁尚為預留（legacy_mobile）。目前可編輯：首頁／商城／團購。現有手機 UI 不受影響。"}
          {" · "}
          <a href={hubHref} className="underline">
            返回頁面清單
          </a>
        </p>
      ) : null}

      <CmsEditorShell
        key={`${platform}-${pageId}-${page.updatedAt ?? ""}-${page.draftVersion ?? 0}`}
        initialPage={page}
        platform={platform}
        legacyHref={LEGACY_HREF[pageId]}
        legacyLabel={pageId === "shop" ? "內容來源（共用）" : undefined}
        readOnly={!canSave}
        allowLocalEdit={canSave}
        versions={versions}
        pageOptions={pageOptions}
        onSaveDraft={canSave ? onSaveDraft : undefined}
        onPublish={canSave ? onPublish : undefined}
        onRestoreVersion={
          canSave && versions.length > 0 ? onRestoreVersion : undefined
        }
      />
    </div>
  );
}
