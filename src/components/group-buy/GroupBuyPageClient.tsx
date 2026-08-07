"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { GroupBuyHeroBanner } from "@/components/group-buy/GroupBuyHeroBanner";
import {
  GroupBuyFilterSheet,
  hasActiveFilters,
  type GroupBuyFilterValues,
} from "@/components/group-buy/GroupBuyFilterSheet";
import { GroupBuyStatusTabs } from "@/components/group-buy/GroupBuyStatusTabs";
import {
  GroupBuyQuickLinks,
  type GroupBuyQuickLinkId,
} from "@/components/group-buy/GroupBuyQuickLinks";
import { GroupBuySectionHeader } from "@/components/group-buy/GroupBuySectionHeader";
import { GroupBuyProductGrid } from "@/components/group-buy/GroupBuyProductGrid";
import { ClosingSoonSection } from "@/components/group-buy/ClosingSoonSection";
import { UpcomingGroupBuySection } from "@/components/group-buy/UpcomingGroupBuySection";
import { GroupBuyEmptyState } from "@/components/group-buy/GroupBuyEmptyState";
import { GroupBuyNoticeSummary } from "@/components/group-buy/GroupBuyNoticeSummary";
import { GroupBuyFooter } from "@/components/group-buy/GroupBuyFooter";
import { GroupBuySkeleton } from "@/components/group-buy/GroupBuySkeleton";
import type { GroupBuyCampaignCardData } from "@/components/group-buy/GroupBuyCampaignCard";
import {
  DEFAULT_GROUP_BUY_PAGE_SETTINGS,
  type GroupBuyPageSettings,
  type GroupBuySort,
  type GroupBuyTab,
} from "@/lib/group-buy/page-settings";
import { GROUP_BUY_BRAND_YELLOW, DEFAULT_GROUP_BUY_HERO } from "@/types/group-buy-hero-banner";
import { DEFAULT_SHOP_PAGE_SETTINGS } from "@/lib/shop/page-settings";

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return desktop;
}

export function GroupBuyPageClient() {
  const [settings, setSettings] = useState<GroupBuyPageSettings>(
    DEFAULT_GROUP_BUY_PAGE_SETTINGS
  );
  const [tab, setTab] = useState<GroupBuyTab>("active");
  const [sort, setSort] = useState<GroupBuySort>("recommended");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<GroupBuyCampaignCardData[]>([]);
  const [endingSoon, setEndingSoon] = useState<GroupBuyCampaignCardData[]>([]);
  const [upcoming, setUpcoming] = useState<GroupBuyCampaignCardData[]>([]);
  const [meta, setMeta] = useState({
    activeCount: 0,
    endingSoonCount: 0,
    upcomingCount: 0,
    allCount: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<GroupBuyFilterValues>({
    sort: "recommended",
    fulfillment: "",
    status: "active",
    category: "",
    priceMin: "",
    priceMax: "",
  });

  const isDesktop = useIsDesktop();

  const pageSize = useMemo(() => {
    if (typeof window === "undefined") return settings.pageSizeDesktop;
    return window.innerWidth < 768 ? settings.pageSizeMobile : settings.pageSizeDesktop;
  }, [settings.pageSizeDesktop, settings.pageSizeMobile]);

  useEffect(() => {
    const previewDraft =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("preview") === "draft";
    fetch(previewDraft ? "/api/group-buy/page-settings?preview=draft" : "/api/group-buy/page-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings(d.settings);
          setTab(d.settings.defaultTab);
          setSort(d.settings.defaultSort);
          setFilterDraft((prev) => ({
            ...prev,
            sort: d.settings.defaultSort,
            status: d.settings.defaultTab,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({
        status: tab,
        sort,
        page: String(page),
        pageSize: String(pageSize),
      });
      if (query) params.set("search", query);
      if (category) params.set("category", category);
      if (fulfillment) params.set("fulfillment", fulfillment);

      const [listRes, soonRes, upRes, allRes, upCountRes] = await Promise.all([
        fetch(`/api/group-buy/campaigns?${params}`),
        settings.sections.ending_soon
          ? fetch("/api/group-buy/campaigns?section=ending_soon")
          : Promise.resolve(null),
        settings.sections.upcoming
          ? fetch("/api/group-buy/campaigns?section=upcoming")
          : Promise.resolve(null),
        fetch("/api/group-buy/campaigns?status=all&page=1&pageSize=1"),
        fetch("/api/group-buy/campaigns?status=upcoming&page=1&pageSize=1"),
      ]);

      if (!listRes.ok) throw new Error("list failed");

      const listData = await listRes.json();
      setCampaigns(listData.campaigns ?? []);
      setCategories(listData.meta?.categories ?? []);

      const allData = allRes.ok ? await allRes.json() : null;
      const upCountData = upCountRes.ok ? await upCountRes.json() : null;

      setMeta({
        activeCount: listData.meta?.activeCount ?? 0,
        endingSoonCount: listData.meta?.endingSoonCount ?? 0,
        upcomingCount: upCountData?.meta?.total ?? 0,
        allCount: allData?.meta?.total ?? listData.meta?.total ?? 0,
        total: listData.meta?.total ?? 0,
      });

      if (soonRes?.ok) {
        const d = await soonRes.json();
        setEndingSoon(d.campaigns ?? []);
      } else setEndingSoon([]);

      if (upRes?.ok) {
        const d = await upRes.json();
        setUpcoming(d.campaigns ?? []);
      } else setUpcoming([]);
    } catch {
      setCampaigns([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [
    tab,
    sort,
    page,
    pageSize,
    query,
    category,
    fulfillment,
    settings.sections.ending_soon,
    settings.sections.upcoming,
  ]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const onHeroSearch = useCallback((q: string) => {
    setQuery(q);
    setPage(1);
  }, []);

  const openFilters = useCallback(() => {
    setFilterDraft({
      sort,
      fulfillment,
      status: tab,
      category,
      priceMin: "",
      priceMax: "",
    });
    setFilterOpen(true);
  }, [sort, fulfillment, tab, category]);

  const applyFilters = useCallback(() => {
    setSort(filterDraft.sort);
    setFulfillment(filterDraft.fulfillment);
    setTab(filterDraft.status);
    setCategory(filterDraft.category);
    // TODO: apply priceMin/priceMax when campaigns API supports price range
    setPage(1);
    setFilterOpen(false);
  }, [filterDraft]);

  const clearFilters = useCallback(() => {
    const next: GroupBuyFilterValues = {
      sort: settings.defaultSort,
      fulfillment: "",
      status: settings.defaultTab,
      category: "",
      priceMin: "",
      priceMax: "",
    };
    setFilterDraft(next);
    setSort(next.sort);
    setFulfillment("");
    setTab(next.status);
    setCategory("");
    setQuery("");
    setPage(1);
    setFilterOpen(false);
  }, [settings.defaultSort, settings.defaultTab]);

  const clearAllForEmpty = useCallback(() => {
    setQuery("");
    setCategory("");
    setFulfillment("");
    setSort(settings.defaultSort);
    setTab("all");
    setPage(1);
  }, [settings.defaultSort]);

  const onQuickLink = useCallback(
    (id: GroupBuyQuickLinkId) => {
      setPage(1);
      if (id === "hot") {
        setSort("popular");
        setTab("active");
      } else if (id === "closing48") {
        setTab("ending_soon");
        setSort("ending_soon");
      } else if (id === "pickup") {
        setFulfillment("store_pickup");
      }
    },
    []
  );

  if (!settings.enabled) {
    return (
      <div className="rounded-[20px] border border-[#E9EDF2] bg-white p-8 text-center text-[#687386]">
        團購專區目前未開放
      </div>
    );
  }

  const headerSettings = {
    ...DEFAULT_SHOP_PAGE_SETTINGS,
    header_bg_color: GROUP_BUY_BRAND_YELLOW,
    hero_bg_color: GROUP_BUY_BRAND_YELLOW,
    header_border_color: null,
  };

  const filterActive = hasActiveFilters({
    fulfillment,
    category,
    sort,
    defaultSort: settings.defaultSort,
  });

  const showClosing =
    settings.sections.ending_soon && endingSoon.length > 0 && tab !== "ending_soon";
  const showUpcoming =
    settings.sections.upcoming && upcoming.length > 0 && tab !== "upcoming";

  return (
    <div className="group-buy-hub space-y-0" style={{ backgroundColor: "#FFFEFA" }}>
      <div
        className="shop-hub-hero-plane w-full max-w-none"
        style={{ backgroundColor: GROUP_BUY_BRAND_YELLOW }}
      >
        <ShopHeader
          settings={headerSettings}
          title="團購"
          searchHref="#group-buy-search-input"
        />
        <GroupBuyHeroBanner
          backgroundColor={GROUP_BUY_BRAND_YELLOW}
          searchPlaceholder={
            settings.searchPlaceholder || DEFAULT_GROUP_BUY_HERO.searchPlaceholder
          }
          onSearch={onHeroSearch}
          onOpenFilters={openFilters}
          filterActive={filterActive || filterOpen}
        />
      </div>

      {filterOpen && isDesktop ? (
        <div className="px-4 md:px-6">
          <GroupBuyFilterSheet
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            settings={settings}
            draft={filterDraft}
            onDraftChange={setFilterDraft}
            categories={categories}
            onClear={clearFilters}
            onApply={applyFilters}
            variant="panel"
          />
        </div>
      ) : null}

      {filterOpen && !isDesktop ? (
        <GroupBuyFilterSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          settings={settings}
          draft={filterDraft}
          onDraftChange={setFilterDraft}
          categories={categories}
          onClear={clearFilters}
          onApply={applyFilters}
          variant="sheet"
        />
      ) : null}

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 pb-8 pt-4 md:gap-8 md:px-6 md:pt-6">
        {settings.sections.tabs ? (
          <GroupBuyStatusTabs
            tabs={settings.enabledTabs}
            value={tab}
            counts={{
              all: meta.allCount,
              active: meta.activeCount,
              ending_soon: meta.endingSoonCount,
              upcoming: meta.upcomingCount,
            }}
            onChange={(t) => {
              setTab(t);
              setPage(1);
            }}
          />
        ) : null}

        <GroupBuyQuickLinks onSelect={onQuickLink} />

        {loadError ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl bg-white px-6 py-10 text-center shadow-[0_6px_20px_rgba(21,62,115,0.08)]">
            <h3 className="text-base font-bold text-[#153E73]">團購商品載入失敗</h3>
            <p className="mt-2 text-sm text-[#687386]">請稍後再試一次。</p>
            <button
              type="button"
              onClick={() => void loadList()}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#F16458] px-6 text-sm font-bold text-white"
              aria-label="重新載入"
            >
              重新載入
            </button>
          </div>
        ) : loading ? (
          <GroupBuySkeleton />
        ) : (
          <>
            {settings.sections.group_buy_list ? (
              <section aria-label="正在開團">
                <GroupBuySectionHeader
                  title="正在開團"
                  subtitle="把喜歡的商品一起帶回家"
                  trailing={
                    <p className="pb-2 text-xs font-medium text-[#687386]">
                      共 {meta.total} 團
                    </p>
                  }
                />
                <div className="mt-4">
                  {campaigns.length === 0 ? (
                    <GroupBuyEmptyState onClearAll={clearAllForEmpty} />
                  ) : (
                    <GroupBuyProductGrid
                      campaigns={campaigns}
                      settings={settings}
                      onExpire={() => void loadList()}
                    />
                  )}
                </div>
                {meta.total > pageSize ? (
                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-11 rounded-full border border-[#E9EDF2] bg-white px-4 text-sm font-semibold text-[#153E73] disabled:opacity-40"
                      aria-label="上一頁"
                    >
                      上一頁
                    </button>
                    <span className="inline-flex h-11 items-center px-2 text-sm text-[#687386]">
                      第 {page} 頁
                    </span>
                    <button
                      type="button"
                      disabled={page * pageSize >= meta.total}
                      onClick={() => setPage((p) => p + 1)}
                      className="h-11 rounded-full border border-[#E9EDF2] bg-white px-4 text-sm font-semibold text-[#153E73] disabled:opacity-40"
                      aria-label="下一頁"
                    >
                      下一頁
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}

            {showClosing ? (
              <ClosingSoonSection
                campaigns={endingSoon}
                settings={settings}
                onViewAll={() => {
                  setTab("ending_soon");
                  setSort("ending_soon");
                  setPage(1);
                }}
                onExpire={() => void loadList()}
              />
            ) : null}

            {showUpcoming ? (
              <UpcomingGroupBuySection
                campaigns={upcoming}
                onViewMore={() => {
                  setTab("upcoming");
                  setPage(1);
                }}
              />
            ) : null}
          </>
        )}

        {settings.sections.purchase_notice &&
        settings.purchaseNoticeEnabled &&
        settings.purchaseNoticeContent.trim() ? (
          <GroupBuyNoticeSummary
            title={settings.purchaseNoticeTitle || "團購購買須知"}
            content={settings.purchaseNoticeContent}
          />
        ) : null}
      </div>

      <GroupBuyFooter />
    </div>
  );
}
