"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import {
  CmsLivePreview,
  CmsSectionList,
  CmsSettingsPanel,
  CmsStudioHeader,
  CmsStudioShell,
  type CmsDevice,
  type CmsSaveStatus,
} from "@/components/admin/cms-studio";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DEFAULT_GROUP_BUY_PAGE_SETTINGS,
  SECTION_LABELS,
  SORT_LABELS,
  TAB_LABELS,
  mergeGroupBuyPageSettings,
  type GroupBuyPageSettings,
  type GroupBuySectionId,
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
    <section className="rounded-[14px] border border-[#E7EAF0] bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-[#153E73]">{title}</h2>
      {children}
    </section>
  );
}

const GLOBAL_ID = "__global__";

export function GroupBuyCmsStudio() {
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
  const [selectedId, setSelectedId] = useState<string>(GLOBAL_ID);
  const [previewDevice, setPreviewDevice] = useState<CmsDevice>("mobile");
  const [previewKey, setPreviewKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<"sections" | "edit" | "preview">("sections");

  const dirty = JSON.stringify(settings) !== JSON.stringify(savedSnapshot);
  const saveStatus: CmsSaveStatus = saving
    ? "saving"
    : error
      ? "error"
      : dirty
        ? "dirty"
        : message
          ? "published"
          : "idle";

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
      setPreviewKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const listItems = [
    { id: GLOBAL_ID, label: "全域／頁首設定", enabled: settings.enabled },
    ...settings.sectionOrder.map((id, index) => ({
      id,
      label: `${index + 1}. ${SECTION_LABELS[id]}`,
      enabled: settings.sections[id],
    })),
  ];

  if (loading) {
    return <p className="text-muted-foreground">載入中…</p>;
  }

  return (
    <CmsStudioShell
      mobileTab={mobileTab}
      onMobileTabChange={setMobileTab}
      header={
        <CmsStudioHeader
          title="團購頁 CMS"
          description="控制前台 /group-buy 區塊與顯示。活動、商品、訂單、分潤仍在「團購管理」。"
          status={saveStatus}
          actions={
            <>
              <Link
                href="/admin/group-buy"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                團購活動
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSettings(savedSnapshot);
                  setError(null);
                  setMessage(null);
                }}
              >
                還原
              </Button>
              <Button
                size="sm"
                className="border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73] hover:bg-[#FFE149]/90"
                disabled={saving}
                onClick={() => void save()}
              >
                <Save className="mr-1 h-3.5 w-3.5" />
                發布
              </Button>
            </>
          }
          notice={
            <>
              {message ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
            </>
          }
        />
      }
      sectionList={
        <CmsSectionList
          title="團購頁區塊"
          items={listItems}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setMobileTab("edit");
          }}
          onReorder={(ids) => {
            const next = ids.filter((id) => id !== GLOBAL_ID) as GroupBuySectionId[];
            patch("sectionOrder", next);
          }}
          onToggleEnabled={(id) => {
            if (id === GLOBAL_ID) {
              patch("enabled", !settings.enabled);
              return;
            }
            const sid = id as GroupBuySectionId;
            patch("sections", { ...settings.sections, [sid]: !settings.sections[sid] });
          }}
          onMove={(id, dir) => {
            if (id === GLOBAL_ID) return;
            const index = settings.sectionOrder.indexOf(id as GroupBuySectionId);
            if (index < 0) return;
            moveSection(index, dir);
          }}
        />
      }
      settingsPanel={
        <CmsSettingsPanel
          title={
            selectedId === GLOBAL_ID
              ? "全域設定"
              : SECTION_LABELS[selectedId as GroupBuySectionId] || "區塊設定"
          }
        >
          <div className="space-y-4">
            {selectedId === GLOBAL_ID ? (
              <>
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
                </SectionCard>

                <SectionCard title="搜尋／篩選／商品卡（摘要）">
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
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    {(
                      Object.entries({
                        image: "商品圖片",
                        status: "團購狀態",
                        name: "商品名稱",
                        groupPrice: "團購價",
                        countdown: "倒數時間",
                        actionButton: "查看團購按鈕",
                      }) as Array<[keyof GroupBuyPageSettings["cardFields"], string]>
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={settings.cardFields[key]}
                          onChange={(e) =>
                            patch("cardFields", {
                              ...settings.cardFields,
                              [key]: e.target.checked,
                            })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </SectionCard>
              </>
            ) : (
              <SectionCard title={SECTION_LABELS[selectedId as GroupBuySectionId]}>
                <label className="mb-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.sections[selectedId as GroupBuySectionId]}
                    onChange={(e) =>
                      patch("sections", {
                        ...settings.sections,
                        [selectedId]: e.target.checked,
                      })
                    }
                  />
                  區塊顯示
                </label>
                <label className="mb-3 block text-xs">
                  自訂標題
                  <input
                    className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
                    value={settings.sectionTitles[selectedId as GroupBuySectionId] ?? ""}
                    onChange={(e) =>
                      patch("sectionTitles", {
                        ...settings.sectionTitles,
                        [selectedId]: e.target.value,
                      })
                    }
                  />
                </label>

                {selectedId === "ending_soon" ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-xs">
                      判定時數
                      <input
                        type="number"
                        className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
                        value={settings.endingSoonHours}
                        onChange={(e) =>
                          patch("endingSoonHours", Number(e.target.value) || 48)
                        }
                      />
                    </label>
                    <label className="text-xs">
                      顯示數量
                      <input
                        type="number"
                        className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
                        value={settings.endingSoonLimit}
                        onChange={(e) =>
                          patch("endingSoonLimit", Number(e.target.value) || 6)
                        }
                      />
                    </label>
                    <label className="flex items-center gap-2 self-end pb-2 text-sm">
                      <input
                        type="checkbox"
                        checked={settings.endingSoonShowCountdown}
                        onChange={(e) => patch("endingSoonShowCountdown", e.target.checked)}
                      />
                      顯示倒數
                    </label>
                  </div>
                ) : null}

                {selectedId === "upcoming" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs">
                      提前顯示天數
                      <input
                        type="number"
                        className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
                        value={settings.upcomingDays}
                        onChange={(e) => patch("upcomingDays", Number(e.target.value) || 14)}
                      />
                    </label>
                    <label className="text-xs">
                      顯示數量
                      <input
                        type="number"
                        className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
                        value={settings.upcomingLimit}
                        onChange={(e) => patch("upcomingLimit", Number(e.target.value) || 6)}
                      />
                    </label>
                  </div>
                ) : null}

                {selectedId === "purchase_notice" ? (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={settings.purchaseNoticeEnabled}
                        onChange={(e) => patch("purchaseNoticeEnabled", e.target.checked)}
                      />
                      區塊啟用
                    </label>
                    <label className="block text-xs">
                      區塊標題
                      <input
                        className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm"
                        value={settings.purchaseNoticeTitle}
                        onChange={(e) => patch("purchaseNoticeTitle", e.target.value)}
                      />
                    </label>
                    <label className="block text-xs">
                      內容
                      <textarea
                        className="mt-1 min-h-[180px] w-full rounded-xl border border-border px-3 py-2 text-sm"
                        value={settings.purchaseNoticeContent}
                        onChange={(e) => patch("purchaseNoticeContent", e.target.value)}
                      />
                    </label>
                  </div>
                ) : null}
              </SectionCard>
            )}
          </div>
        </CmsSettingsPanel>
      }
      preview={
        <CmsLivePreview
          title="團購頁預覽"
          src={`/group-buy?v=${previewKey}`}
          reloadKey={previewKey}
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
          fullPreviewHref="/group-buy"
          highlightLabel={
            selectedId === GLOBAL_ID
              ? "全域設定"
              : SECTION_LABELS[selectedId as GroupBuySectionId]
          }
        />
      }
      footer={
        <div className="flex flex-wrap gap-2">
          <Button
            className="flex-1 border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73] hover:bg-[#FFE149]/90 lg:flex-none"
            disabled={saving}
            onClick={() => void save()}
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            發布
          </Button>
          <Button
            variant="outline"
            className="flex-1 lg:flex-none"
            onClick={() => setMobileTab("preview")}
          >
            預覽
          </Button>
        </div>
      }
    />
  );
}
