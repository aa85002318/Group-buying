"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GripVertical, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_GROUP_BUY_PAGE_SETTINGS,
  SECTION_LABELS,
  SORT_LABELS,
  TAB_LABELS,
  mergeGroupBuyPageSettings,
  type GroupBuyPageSettings,
  type GroupBuySort,
  type GroupBuyTab,
} from "@/lib/group-buy/page-settings";
import { cn } from "@/lib/utils";

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
      <h2 className="mb-4 text-sm font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export default function AdminGroupBuySettingsPage() {
  const [settings, setSettings] = useState<GroupBuyPageSettings>(
    DEFAULT_GROUP_BUY_PAGE_SETTINGS
  );
  const [savedSnapshot, setSavedSnapshot] = useState<GroupBuyPageSettings>(
    DEFAULT_GROUP_BUY_PAGE_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/group-buy/page-settings")
      .then((r) => r.json())
      .then((d) => {
        const next = mergeGroupBuyPageSettings(d.settings);
        setSettings(next);
        setSavedSnapshot(next);
      })
      .catch(() => setError("載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = <K extends keyof GroupBuyPageSettings>(key: K, value: GroupBuyPageSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
    setError(null);
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    setSettings((prev) => {
      const order = [...prev.sectionOrder];
      const target = index + dir;
      if (target < 0 || target >= order.length) return prev;
      const tmp = order[index]!;
      order[index] = order[target]!;
      order[target] = tmp;
      return { ...prev, sectionOrder: order };
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/group-buy/page-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      const next = mergeGroupBuyPageSettings(data.settings);
      setSettings(next);
      setSavedSnapshot(next);
      setMessage(data.message ?? "團購頁面設定已更新");
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-foreground-secondary">載入中…</p>;
  }

  return (
    <div className="space-y-6 pb-24">
      <AdminPageHeader
        title="團購頁面設定"
        description="控制前台 /group-buy 的區塊、分頁、商品卡與購買須知"
        actions={
          <Link href="/admin/group-buy">
            <Button variant="outline">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              團購活動
            </Button>
          </Link>
        }
      />

      {message && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <SectionCard title="基本設定">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => patch("enabled", e.target.checked)}
            />
            頁面啟用
          </label>
          <label className="text-xs sm:col-span-2">
            頁面標題
            <input
              className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={settings.title}
              onChange={(e) => patch("title", e.target.value)}
            />
          </label>
          <label className="text-xs sm:col-span-2">
            頁面副標題
            <input
              className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={settings.subtitle ?? ""}
              onChange={(e) => patch("subtitle", e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.showActiveCount}
              onChange={(e) => patch("showActiveCount", e.target.checked)}
            />
            顯示開團數
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.showEndingSoonCount}
              onChange={(e) => patch("showEndingSoonCount", e.target.checked)}
            />
            顯示即將結團數
          </label>
          <label className="text-xs">
            桌機每頁商品數
            <input
              type="number"
              min={4}
              max={48}
              className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={settings.pageSizeDesktop}
              onChange={(e) => patch("pageSizeDesktop", Number(e.target.value) || 12)}
            />
          </label>
          <label className="text-xs">
            手機每頁商品數
            <input
              type="number"
              min={4}
              max={48}
              className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={settings.pageSizeMobile}
              onChange={(e) => patch("pageSizeMobile", Number(e.target.value) || 10)}
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="區塊與排序">
        <p className="mb-3 text-xs text-foreground-secondary">勾選啟用，使用上下箭頭調整順序</p>
        <div className="space-y-2">
          {settings.sectionOrder.map((id, index) => (
            <div
              key={id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2"
            >
              <GripVertical className="h-4 w-4 text-foreground-muted" />
              <label className="flex min-w-[140px] items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={settings.sections[id]}
                  onChange={(e) =>
                    patch("sections", { ...settings.sections, [id]: e.target.checked })
                  }
                />
                {SECTION_LABELS[id]}
              </label>
              <input
                className="h-8 min-w-[120px] flex-1 rounded-lg border border-border px-2 text-xs"
                placeholder="自訂標題"
                value={settings.sectionTitles[id] ?? ""}
                onChange={(e) =>
                  patch("sectionTitles", {
                    ...settings.sectionTitles,
                    [id]: e.target.value,
                  })
                }
              />
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => moveSection(index, -1)}>
                  ↑
                </Button>
                <Button size="sm" variant="outline" onClick={() => moveSection(index, 1)}>
                  ↓
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="狀態分頁">
        <div className="mb-3 flex flex-wrap gap-3">
          {(Object.keys(TAB_LABELS) as GroupBuyTab[]).map((tab) => (
            <label key={tab} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.enabledTabs.includes(tab)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...settings.enabledTabs, tab]
                    : settings.enabledTabs.filter((t) => t !== tab);
                  patch("enabledTabs", next);
                }}
              />
              {TAB_LABELS[tab]}
            </label>
          ))}
        </div>
        <div className="text-sm">
          <p className="mb-2 text-xs text-foreground-secondary">預設分頁</p>
          <div className="flex flex-wrap gap-3">
            {settings.enabledTabs.map((tab) => (
              <label key={tab} className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="defaultTab"
                  checked={settings.defaultTab === tab}
                  onChange={() => patch("defaultTab", tab)}
                />
                {TAB_LABELS[tab]}
              </label>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="即將結團">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs">
            判定時數
            <input
              type="number"
              min={1}
              max={168}
              className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={settings.endingSoonHours}
              onChange={(e) => patch("endingSoonHours", Number(e.target.value) || 48)}
            />
          </label>
          <label className="text-xs">
            顯示數量
            <input
              type="number"
              min={1}
              max={24}
              className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={settings.endingSoonLimit}
              onChange={(e) => patch("endingSoonLimit", Number(e.target.value) || 6)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm self-end pb-2">
            <input
              type="checkbox"
              checked={settings.endingSoonShowCountdown}
              onChange={(e) => patch("endingSoonShowCountdown", e.target.checked)}
            />
            顯示倒數計時
          </label>
        </div>
      </SectionCard>

      <SectionCard title="即將開團">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            提前顯示天數
            <input
              type="number"
              min={1}
              max={90}
              className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={settings.upcomingDays}
              onChange={(e) => patch("upcomingDays", Number(e.target.value) || 14)}
            />
          </label>
          <label className="text-xs">
            顯示數量
            <input
              type="number"
              min={1}
              max={24}
              className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={settings.upcomingLimit}
              onChange={(e) => patch("upcomingLimit", Number(e.target.value) || 6)}
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="搜尋與篩選">
        <label className="mb-3 block text-xs">
          搜尋 placeholder
          <input
            className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
            value={settings.searchPlaceholder}
            onChange={(e) => patch("searchPlaceholder", e.target.value)}
          />
        </label>
        <div className="mb-3 flex flex-wrap gap-3 text-sm">
          {(
            [
              ["name", "商品名稱"],
              ["subtitle", "商品簡稱"],
              ["brand", "品牌"],
              ["keyword", "團購關鍵字"],
              ["sku", "SKU"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={settings.enabledSearchFields[key]}
                onChange={(e) =>
                  patch("enabledSearchFields", {
                    ...settings.enabledSearchFields,
                    [key]: e.target.checked,
                  })
                }
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mb-3 flex flex-wrap gap-3 text-sm">
          {(
            [
              ["category", "團購分類"],
              ["fulfillment", "取貨方式"],
              ["status", "開團狀態"],
              ["price", "價格區間"],
              ["endingTime", "結團時間"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={settings.enabledFilters[key]}
                onChange={(e) =>
                  patch("enabledFilters", {
                    ...settings.enabledFilters,
                    [key]: e.target.checked,
                  })
                }
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mb-2 text-xs text-foreground-secondary">排序選項</div>
        <div className="mb-3 flex flex-wrap gap-3 text-sm">
          {(Object.keys(SORT_LABELS) as GroupBuySort[]).map((s) => (
            <label key={s} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={settings.enabledSorts.includes(s)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...settings.enabledSorts, s]
                    : settings.enabledSorts.filter((x) => x !== s);
                  patch("enabledSorts", next);
                }}
              />
              {SORT_LABELS[s]}
            </label>
          ))}
        </div>
        <div className="text-sm">
          <p className="mb-2 text-xs text-foreground-secondary">預設排序</p>
          <select
            className="h-10 rounded-xl border border-border px-3 text-sm"
            value={settings.defaultSort}
            onChange={(e) => patch("defaultSort", e.target.value as GroupBuySort)}
          >
            {settings.enabledSorts.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <SectionCard title="商品卡顯示">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {(
            Object.entries({
              image: "商品圖片",
              status: "團購狀態",
              name: "商品名稱",
              spec: "商品規格",
              groupPrice: "團購價",
              originalPrice: "原價",
              savings: "現省金額",
              endDate: "結團日期",
              countdown: "倒數時間",
              participantCount: "已跟團人數",
              soldQuantity: "已售件數",
              progress: "團購進度",
              fulfillment: "取貨方式",
              tags: "商品標籤",
              actionButton: "查看團購按鈕",
            }) as Array<[keyof GroupBuyPageSettings["cardFields"], string]>
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={settings.cardFields[key]}
                onChange={(e) =>
                  patch("cardFields", { ...settings.cardFields, [key]: e.target.checked })
                }
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["active", "進行中按鈕"],
              ["ending_soon", "即將結團按鈕"],
              ["upcoming", "即將開團按鈕"],
              ["ended", "已結團按鈕"],
              ["sold_out", "已售罄按鈕"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-xs">
              {label}
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
                value={settings.buttonLabels[key]}
                onChange={(e) =>
                  patch("buttonLabels", {
                    ...settings.buttonLabels,
                    [key]: e.target.value,
                  })
                }
              />
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="團購須知">
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.purchaseNoticeEnabled}
            onChange={(e) => patch("purchaseNoticeEnabled", e.target.checked)}
          />
          區塊啟用
        </label>
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.purchaseNoticeDefaultOpen}
            onChange={(e) => patch("purchaseNoticeDefaultOpen", e.target.checked)}
          />
          預設展開第一則
        </label>
        <label className="mb-3 block text-xs">
          區塊標題
          <input
            className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
            value={settings.purchaseNoticeTitle}
            onChange={(e) => patch("purchaseNoticeTitle", e.target.value)}
          />
        </label>
        <label className="block text-xs">
          內容（以空行分段；第一行可當小標）
          <textarea
            className="mt-1 min-h-[220px] w-full rounded-xl border border-border px-3 py-2 text-sm"
            value={settings.purchaseNoticeContent}
            onChange={(e) => patch("purchaseNoticeContent", e.target.value)}
          />
        </label>
      </SectionCard>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 py-3 backdrop-blur",
          "md:left-[var(--admin-sidebar-width,0px)]"
        )}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSettings(savedSnapshot);
              setError(null);
              setMessage(null);
            }}
          >
            還原上次儲存
          </Button>
          <Button onClick={save} disabled={saving} className="bg-primary hover:bg-[#E63D6A]">
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "儲存中…" : "儲存設定"}
          </Button>
        </div>
      </div>
    </div>
  );
}
