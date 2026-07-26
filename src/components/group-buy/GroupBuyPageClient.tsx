"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_GROUP_BUY_PAGE_SETTINGS,
  TAB_LABELS,
  SORT_LABELS,
  type GroupBuyPageSettings,
  type GroupBuySort,
  type GroupBuyTab,
  type GroupBuySectionId,
} from "@/lib/group-buy/page-settings";
import {
  GroupBuyCampaignCard,
  type GroupBuyCampaignCardData,
} from "@/components/group-buy/GroupBuyCampaignCard";
import { cn } from "@/lib/utils";

function NoticeAccordion({
  title,
  content,
  defaultOpen,
}: {
  title: string;
  content: string;
  defaultOpen: boolean;
}) {
  const blocks = content
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const [openIdx, setOpenIdx] = useState<number | null>(defaultOpen ? 0 : null);

  return (
    <section className="rounded-[20px] border border-border bg-white p-4 shadow-card">
      <h2 className="mb-3 text-lg font-black text-foreground">{title}</h2>
      <div className="space-y-2">
        {blocks.map((block, idx) => {
          const lines = block.split("\n");
          const head = lines[0] ?? `說明 ${idx + 1}`;
          const body = lines.slice(1).join("\n") || lines[0];
          const open = openIdx === idx;
          return (
            <div key={idx} className="overflow-hidden rounded-xl border border-border">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold"
                onClick={() => setOpenIdx(open ? null : idx)}
              >
                <span>{head.replace(/^【|】$/g, "")}</span>
                <span className="text-foreground-muted">{open ? "−" : "+"}</span>
              </button>
              {open && (
                <div className="border-t border-border px-3 py-2 text-sm whitespace-pre-wrap text-foreground-secondary">
                  {body}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function GroupBuyPageClient() {
  const [settings, setSettings] = useState<GroupBuyPageSettings>(
    DEFAULT_GROUP_BUY_PAGE_SETTINGS
  );
  const [tab, setTab] = useState<GroupBuyTab>("active");
  const [sort, setSort] = useState<GroupBuySort>("recommended");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [campaigns, setCampaigns] = useState<GroupBuyCampaignCardData[]>([]);
  const [endingSoon, setEndingSoon] = useState<GroupBuyCampaignCardData[]>([]);
  const [upcoming, setUpcoming] = useState<GroupBuyCampaignCardData[]>([]);
  const [meta, setMeta] = useState({ activeCount: 0, endingSoonCount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const pageSize = useMemo(() => {
    if (typeof window === "undefined") return settings.pageSizeDesktop;
    return window.innerWidth < 768 ? settings.pageSizeMobile : settings.pageSizeDesktop;
  }, [settings.pageSizeDesktop, settings.pageSizeMobile]);

  useEffect(() => {
    fetch("/api/group-buy/page-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings(d.settings);
          setTab(d.settings.defaultTab);
          setSort(d.settings.defaultSort);
        }
      })
      .catch(() => {});
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: tab,
        sort,
        page: String(page),
        pageSize: String(pageSize),
      });
      if (query) params.set("search", query);

      const [listRes, soonRes, upRes] = await Promise.all([
        fetch(`/api/group-buy/campaigns?${params}`),
        settings.sections.ending_soon
          ? fetch("/api/group-buy/campaigns?section=ending_soon")
          : Promise.resolve(null),
        settings.sections.upcoming
          ? fetch("/api/group-buy/campaigns?section=upcoming")
          : Promise.resolve(null),
      ]);

      const listData = await listRes.json();
      setCampaigns(listData.campaigns ?? []);
      setMeta({
        activeCount: listData.meta?.activeCount ?? 0,
        endingSoonCount: listData.meta?.endingSoonCount ?? 0,
        total: listData.meta?.total ?? 0,
      });

      if (soonRes) {
        const d = await soonRes.json();
        setEndingSoon(d.campaigns ?? []);
      } else setEndingSoon([]);

      if (upRes) {
        const d = await upRes.json();
        setUpcoming(d.campaigns ?? []);
      } else setUpcoming([]);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [tab, sort, page, pageSize, query, settings.sections.ending_soon, settings.sections.upcoming]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  if (!settings.enabled) {
    return (
      <div className="rounded-[20px] border border-border bg-white p-8 text-center text-foreground-secondary">
        團購專區目前未開放
      </div>
    );
  }

  const renderSection = (id: GroupBuySectionId) => {
    if (!settings.sections[id]) return null;

    if (id === "header") {
      return (
        <header key={id} className="space-y-2">
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">{settings.title}</h1>
          {settings.subtitle && (
            <p className="text-sm text-foreground-secondary">{settings.subtitle}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-groupBuy">
            {settings.showActiveCount && <span>目前開團 {meta.activeCount} 團</span>}
            {settings.showEndingSoonCount && <span>即將結團 {meta.endingSoonCount} 團</span>}
          </div>
        </header>
      );
    }

    if (id === "tabs") {
      return (
        <div key={id} className="-mx-1 overflow-x-auto px-1">
          <div className="flex min-w-max gap-2 pb-1">
            {settings.enabledTabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-semibold whitespace-nowrap",
                  tab === t
                    ? "border-groupBuy bg-groupBuy text-white"
                    : "border-border bg-white text-foreground"
                )}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (id === "search_filters") {
      return (
        <div key={id} className="space-y-3 rounded-[20px] border border-border bg-white p-4 shadow-card">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search.trim());
              setPage(1);
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={settings.searchPlaceholder}
              className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-groupBuy"
            />
            <button
              type="submit"
              className="h-11 rounded-xl bg-groupBuy px-4 text-sm font-bold text-white"
            >
              搜尋
            </button>
          </form>
          {settings.enabledSorts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-foreground-secondary">排序</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as GroupBuySort);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-border bg-background px-2"
              >
                {settings.enabledSorts.map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      );
    }

    if (id === "ending_soon") {
      if (!endingSoon.length) return null;
      return (
        <section key={id} className="space-y-3">
          <div>
            <h2 className="text-lg font-black">
              {settings.sectionTitles.ending_soon ?? "即將結團"}
            </h2>
            {settings.sectionSubtitles.ending_soon && (
              <p className="text-sm text-foreground-secondary">
                {settings.sectionSubtitles.ending_soon}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {endingSoon.map((c) => (
              <GroupBuyCampaignCard key={`soon-${c.id}`} campaign={c} settings={settings} />
            ))}
          </div>
        </section>
      );
    }

    if (id === "group_buy_list") {
      return (
        <section key={id} className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-black">
                {settings.sectionTitles.group_buy_list ?? "團購商品列表"}
              </h2>
              {settings.sectionSubtitles.group_buy_list && (
                <p className="text-sm text-foreground-secondary">
                  {settings.sectionSubtitles.group_buy_list}
                </p>
              )}
            </div>
            <p className="text-xs text-foreground-secondary">共 {meta.total} 團</p>
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-foreground-secondary">載入中…</p>
          ) : campaigns.length === 0 ? (
            <p className="rounded-[16px] bg-groupBuy-soft p-6 text-center text-sm text-foreground-secondary">
              目前沒有符合條件的團購。
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c) => (
                <GroupBuyCampaignCard key={c.id} campaign={c} settings={settings} />
              ))}
            </div>
          )}
          {meta.total > pageSize && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40"
              >
                上一頁
              </button>
              <span className="px-2 py-1.5 text-sm text-foreground-secondary">第 {page} 頁</span>
              <button
                type="button"
                disabled={page * pageSize >= meta.total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40"
              >
                下一頁
              </button>
            </div>
          )}
        </section>
      );
    }

    if (id === "upcoming") {
      if (!upcoming.length) return null;
      return (
        <section key={id} className="space-y-3">
          <div>
            <h2 className="text-lg font-black">
              {settings.sectionTitles.upcoming ?? "即將開團"}
            </h2>
            {settings.sectionSubtitles.upcoming && (
              <p className="text-sm text-foreground-secondary">
                {settings.sectionSubtitles.upcoming}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((c) => (
              <GroupBuyCampaignCard key={`up-${c.id}`} campaign={c} settings={settings} />
            ))}
          </div>
        </section>
      );
    }

    if (id === "purchase_notice") {
      if (!settings.purchaseNoticeEnabled || !settings.purchaseNoticeContent.trim()) {
        return null;
      }
      return (
        <NoticeAccordion
          key={id}
          title={settings.purchaseNoticeTitle || "團購購買須知"}
          content={settings.purchaseNoticeContent}
          defaultOpen={settings.purchaseNoticeDefaultOpen}
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-8 page-enter">
      {settings.sectionOrder.map((id) => renderSection(id))}
    </div>
  );
}
