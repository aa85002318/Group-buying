"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adaptGroupBuySettingsToCmsPage,
  adaptHomeBlocksToCmsPage,
  adaptRecipesPageSettings,
  adaptShopLayoutToCmsPage,
  adaptUnsetPage,
} from "@/lib/cms/cms-adapters";
import { getPageRegistryEntry } from "@/lib/cms/page-registry";
import type { CmsPage } from "@/types/cms";
import { CmsEditorShell } from "@/components/admin/cms/CmsEditorShell";
import type { CmsVersionLite } from "@/components/admin/cms/CmsVersionHistoryPanel";
import type { HomepageBlock } from "@/lib/types/database";
import type { ShopLayoutSettings } from "@/lib/shop/layout-settings";
import type { GroupBuyPageSettings } from "@/lib/group-buy/page-settings";

const LEGACY_HREF: Record<string, string> = {
  home: "/admin/home",
  shop: "/admin/shop/home",
  group_buy: "/admin/group-buy/settings",
  recipes: "/admin/recipes/settings",
  global_header: "/admin/header-promos",
  global_side_menu: "/admin/side-menu",
};

/**
 * Loads page via adapters (readonly from live/draft APIs) into CmsEditorShell.
 * Local canvas mutations allowed; server save/publish left unwired in Phase 1
 * except where classic APIs already exist (buttons stay disabled by default).
 */
export function CmsCanvasPageLoader({ pageId }: { pageId: string }) {
  const entry = getPageRegistryEntry(pageId);
  const [page, setPage] = useState<CmsPage | null>(null);
  const [versions, setVersions] = useState<CmsVersionLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (pageId === "home") {
        const res = await fetch("/api/admin/cms?type=blocks&source=draft");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "載入失敗");
        setPage(
          adaptHomeBlocksToCmsPage((data.blocks ?? []) as HomepageBlock[], {
            draftVersion: 1,
          })
        );
        setVersions([]);
      } else if (pageId === "shop") {
        const [layoutRes, homeRes] = await Promise.all([
          fetch("/api/admin/shop/layout"),
          fetch("/api/admin/shop/home-settings"),
        ]);
        const data = await layoutRes.json();
        if (!layoutRes.ok) throw new Error(data.error ?? "載入失敗");
        const home = homeRes.ok ? await homeRes.json() : {};
        setPage(
          adaptShopLayoutToCmsPage(data.settings as ShopLayoutSettings, {
            draftVersion: data.draft?.version_number,
            updatedAt: data.draft?.updated_at,
            homeSettings: home.settings ?? null,
          })
        );
        setVersions((data.versions ?? []) as CmsVersionLite[]);
      } else if (pageId === "group_buy") {
        const res = await fetch("/api/admin/group-buy/page-settings");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "載入失敗");
        setPage(
          adaptGroupBuySettingsToCmsPage(data.settings as GroupBuyPageSettings, {
            draftVersion: data.draft?.version_number,
            updatedAt: data.draft?.updated_at,
          })
        );
        setVersions((data.versions ?? []) as CmsVersionLite[]);
      } else if (pageId === "recipes") {
        // Live-only today — no draft API; show unset/stub from registry
        setPage(adaptRecipesPageSettings({}, {}));
        setVersions([]);
      } else {
        setPage(adaptUnsetPage(pageId));
        setVersions([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
      setPage(adaptUnsetPage(pageId));
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="p-6 text-sm text-[#8A94A6]">載入畫布…</p>;
  }

  if (!page) {
    return <p className="p-6 text-sm text-[#B42318]">{error ?? "找不到頁面"}</p>;
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-[12px] bg-[#FDE8E6] px-3 py-2 text-sm text-[#B42318]">
          {error}（已顯示預留頁面）
        </p>
      ) : null}
      {!entry?.hasLayoutCms ? (
        <p className="rounded-[12px] bg-[#FFF5CC] px-3 py-2 text-sm text-[#153E73]">
          此頁尚未有版型 CMS。畫布僅供規劃預留，不會寫入正式前台。
        </p>
      ) : null}
      <CmsEditorShell
        initialPage={page}
        legacyHref={LEGACY_HREF[pageId]}
        legacyLabel={pageId === "shop" ? "商城首頁設定" : undefined}
        readOnly={false}
        allowLocalEdit
        versions={versions}
        description={entry?.description}
      />
    </div>
  );
}
