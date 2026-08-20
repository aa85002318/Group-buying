"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ExternalLink, Save } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  DEFAULT_SHOP_LAYOUT,
  mergeShopLayoutSettings,
  SHOP_LAYOUT_MAIN_IDS,
  SHOP_LAYOUT_SECTION_LABELS,
  type ShopLayoutSectionId,
  type ShopLayoutSettings,
} from "@/lib/shop/layout-settings";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  SHOP_HEADER_COLOR_PRESETS,
  type ShopPageSettings,
} from "@/lib/shop/page-settings";

type ShopSectionDef = {
  id: string;
  label: string;
  description: string;
  href: string;
  group: "main" | "extra";
  layoutId?: ShopLayoutSectionId;
  tip?: string;
};

const SHOP_SECTIONS: ShopSectionDef[] = [
  {
    id: "categories",
    label: "商品分類",
    description: "搜尋欄下方圓形主分類：文字、logo、色卡。",
    href: "/admin/shop/categories",
    group: "main",
    layoutId: "categories",
    tip: "調整顯示於商城首頁的主分類與排序。",
  },
  {
    id: "features",
    label: "三格特色",
    description: "固定 3 格 banner 圖（無區塊標題）。",
    href: "/admin/shop/features",
    group: "main",
    layoutId: "features",
  },
  {
    id: "promo",
    label: "活動 Banner",
    description: "5:2 活動輪播，可新增多張。",
    href: "/admin/shop/promo-banners",
    group: "main",
    layoutId: "promo",
  },
  {
    id: "popular",
    label: "熱門商品",
    description: "依商城主分類自動排序預覽。",
    href: "/admin/shop/popular-products",
    group: "main",
    layoutId: "popular",
    tip: "熱門商品由商品主檔標記驅動；此頁為預覽與說明。",
  },
  {
    id: "new",
    label: "新品上架",
    description: "依新品旗標／上架時間自動排序。",
    href: "/admin/shop/new-products",
    group: "main",
    layoutId: "new",
    tip: "請至商品主檔標記新品。",
  },
  {
    id: "inspiration",
    label: "烘焙靈感牆",
    description: "精選食譜、滿版 banner、排序。",
    href: "/admin/shop/inspiration",
    group: "main",
    layoutId: "inspiration",
  },
  {
    id: "recipe-categories",
    label: "食譜分類",
    description: "靈感牆分類與上方圖案。",
    href: "/admin/shop/recipe-categories",
    group: "main",
    tip: "內容細項仍即時儲存；版面顯示／隱藏請用靈感牆開關。",
  },
  {
    id: "info-banners",
    label: "訂購／企業 Banner",
    description: "兩張 5:2：訂購須知與企業詢問。",
    href: "/admin/shop/info-banners",
    group: "main",
    layoutId: "info-banners",
  },
  {
    id: "appearance",
    label: "頁首／Hero 外觀",
    description: "頁首底色、Hero 底色銜接（寫入版面草稿）。",
    href: "/admin/shop/appearance",
    group: "extra",
  },
  {
    id: "hero",
    label: "商城 Hero Banner",
    description: "滿寬主視覺圖，高度隨圖。",
    href: "/admin/shop/hero-banners",
    group: "extra",
    layoutId: "hero",
  },
  {
    id: "ai-assistant",
    label: "AI 助手卡",
    description: "商城內暖黃 AI 功能卡（不是 /ai 頁）。",
    href: "/admin/shop/ai-assistant",
    group: "extra",
    layoutId: "ai-assistant",
  },
  {
    id: "ai-chips",
    label: "AI 推薦 Chip",
    description: "商城 AI 推薦快捷 chip。",
    href: "/admin/shop/ai-chips",
    group: "extra",
    tip: "Chip 內容細項仍即時儲存；卡片顯示請用 AI 助手卡開關。",
  },
];

export function ShopCmsStudio() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionFromUrl = searchParams.get("section");

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (sectionFromUrl && SHOP_SECTIONS.some((s) => s.id === sectionFromUrl)) {
      return sectionFromUrl;
    }
    return SHOP_SECTIONS[0]!.id;
  });
  const [previewDevice, setPreviewDevice] = useState<CmsDevice>("mobile");
  const [previewKey, setPreviewKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<"sections" | "edit" | "preview">("sections");
  const [layout, setLayout] = useState<ShopLayoutSettings>(DEFAULT_SHOP_LAYOUT);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<CmsSaveStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/shop/layout");
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "載入失敗");
      setLayout(mergeShopLayoutSettings(d.settings ?? DEFAULT_SHOP_LAYOUT));
      setDirty(false);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!sectionFromUrl) return;
    if (!SHOP_SECTIONS.some((s) => s.id === sectionFromUrl)) return;
    setSelectedId(sectionFromUrl);
    setMobileTab("edit");
  }, [sectionFromUrl]);

  const patchLayout = (next: ShopLayoutSettings) => {
    setLayout(next);
    setDirty(true);
    setStatus("idle");
    setMessage(null);
  };

  const patchAppearance = (partial: Partial<ShopPageSettings>) => {
    patchLayout({
      ...layout,
      appearance: { ...layout.appearance, ...partial },
    });
  };

  const saveDraft = async () => {
    setStatus("saving");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/shop/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: layout }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setLayout(mergeShopLayoutSettings(d.settings ?? layout));
      setDirty(false);
      setStatus("saved");
      setMessage(d.message ?? "草稿已儲存（尚未上線）");
      setPreviewKey((k) => k + 1);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "儲存失敗");
    }
  };

  const selectSection = (id: string) => {
    setSelectedId(id);
    setMobileTab("edit");
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const selected = SHOP_SECTIONS.find((s) => s.id === selectedId) ?? SHOP_SECTIONS[0]!;
  const workflowActive =
    mobileTab === "preview" ? "preview" : mobileTab === "edit" ? "edit" : "list";

  const listItems = useMemo(() => {
    const byLayout = new Map(
      SHOP_SECTIONS.filter((s) => s.layoutId && s.layoutId !== "hero").map((s) => [
        s.layoutId!,
        s,
      ])
    );
    return layout.sectionOrder
      .filter((id) => id !== "hero")
      .map((layoutId, i) => {
        const def = byLayout.get(layoutId);
        return {
          id: layoutId,
          label: `${i + 1}. ${def?.label ?? SHOP_LAYOUT_SECTION_LABELS[layoutId]}`,
          enabled: layout.sections[layoutId] !== false,
          subtitle: def?.description,
        };
      });
  }, [layout]);

  const extraDefs = SHOP_SECTIONS.filter((s) => s.group === "extra");

  const previewHref = `/shop?preview=draft&v=${previewKey}`;

  return (
    <CmsStudioShell
      mobileTab={mobileTab}
      onMobileTabChange={setMobileTab}
      header={
        <div className="space-y-3">
          <CmsStudioHeader
            title="商城 CMS"
            description="區塊顯示／排序與外觀先存草稿；細項內容（Banner 圖等）仍進階編輯後即時上線。"
            status={status}
            actions={
              <>
                <Link
                  href="/admin/frontend-cms/shop"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                >
                  開啟畫布編輯器
                </Link>
                <Link
                  href={previewHref}
                  target="_blank"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                >
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  草稿預覽
                </Link>
                <Button
                  type="button"
                  size="sm"
                  className="border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73] hover:bg-[#FFE149]/90"
                  disabled={loading || status === "saving" || !dirty}
                  onClick={() => void saveDraft()}
                >
                  <Save className="mr-1 h-3.5 w-3.5" />
                  儲存草稿
                </Button>
              </>
            }
            notice={
              <div className="space-y-2">
                <CmsWorkflowSteps active={workflowActive} />
                {message ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    {message}
                  </p>
                ) : null}
                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </p>
                ) : null}
                <p className="rounded-lg border border-[#FFE149]/60 bg-[#FFFBEA] px-3 py-2 text-xs text-[#153E73]">
                  版面草稿控制顯示／排序／外觀色。Banner、分類等素材內容請進階編輯（仍儲存即上線）。
                </p>
              </div>
            }
          />
          <CmsVersionPublishBar
            apiPath="/api/admin/shop/layout"
            title="商城版面草稿與發布"
            description="儲存草稿不會改訪客看到的 /shop；按「發布上線」後才套用區塊顯示與外觀。"
            previewHref={previewHref}
            publishConfirm="確定將商城版面草稿發布到線上？"
            publishDisabled={dirty}
            publishDisabledHint="尚有未儲存變更，請先按「儲存草稿」再發布。"
            onChanged={() => {
              void load();
              setPreviewKey((k) => k + 1);
              setMessage("已發布到線上");
            }}
          />
        </div>
      }
      sectionList={
        <div className="flex h-full min-h-0 flex-col">
          <CmsSectionList
            title="商城頁面區塊"
            items={listItems}
            selectedId={
              selected.layoutId && selected.layoutId !== "hero"
                ? selected.layoutId
                : selectedId
            }
            onSelect={(id) => {
              const def =
                SHOP_SECTIONS.find((s) => s.layoutId === id) ??
                SHOP_SECTIONS.find((s) => s.id === id);
              selectSection(def?.id ?? id);
            }}
            onReorder={(ids) => {
              const next = ids.filter((id): id is ShopLayoutSectionId =>
                SHOP_LAYOUT_MAIN_IDS.includes(id as ShopLayoutSectionId)
              );
              patchLayout({ ...layout, sectionOrder: next });
            }}
            onToggleEnabled={(id) => {
              if (!SHOP_LAYOUT_MAIN_IDS.includes(id as ShopLayoutSectionId)) return;
              const sid = id as ShopLayoutSectionId;
              patchLayout({
                ...layout,
                sections: {
                  ...layout.sections,
                  [sid]: !(layout.sections[sid] !== false),
                },
              });
            }}
            footer={
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#153E73]/50">
                  附加設定
                </p>
                {extraDefs.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={cn(
                      "w-full rounded-xl px-3 py-2 text-left text-[14px] font-semibold",
                      selectedId === s.id
                        ? "bg-[#FFF5C7] text-[#153E73]"
                        : "text-[#153E73]/80 hover:bg-[#FFFBEA]"
                    )}
                    onClick={() => selectSection(s.id)}
                  >
                    {s.label}
                    {s.layoutId ? (
                      <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                        {layout.sections[s.layoutId] !== false ? "顯示中" : "已隱藏"}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            }
          />
        </div>
      }
      settingsPanel={
        <CmsSettingsPanel
          title={selected.label}
          subtitle={selected.group === "extra" ? "附加設定" : "主區塊"}
        >
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">載入版面草稿…</p>
            ) : null}

            <p className="text-sm text-[#153E73]/80">{selected.description}</p>
            {selected.tip ? (
              <p className="rounded-lg border border-[#E7EAF0] bg-[#F7F8FA] px-3 py-2 text-xs text-muted-foreground">
                {selected.tip}
              </p>
            ) : null}

            {selected.layoutId ? (
              <label className="flex items-center gap-2 rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-sm text-[#153E73]">
                <input
                  type="checkbox"
                  checked={layout.sections[selected.layoutId] !== false}
                  onChange={(e) =>
                    patchLayout({
                      ...layout,
                      sections: {
                        ...layout.sections,
                        [selected.layoutId!]: e.target.checked,
                      },
                    })
                  }
                />
                在商城首頁顯示此區塊
              </label>
            ) : null}

            {selected.id === "appearance" ? (
              <div className="space-y-3 rounded-xl border border-[#E7EAF0] bg-white p-3">
                <p className="text-xs font-semibold text-[#153E73]">外觀色（草稿）</p>
                <label className="block text-xs text-muted-foreground">
                  頁首／Hero 底色
                  <input
                    type="color"
                    className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-border"
                    value={layout.appearance.header_bg_color || DEFAULT_SHOP_PAGE_SETTINGS.header_bg_color}
                    onChange={(e) =>
                      patchAppearance({
                        header_bg_color: e.target.value.toUpperCase(),
                        hero_bg_color: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {SHOP_HEADER_COLOR_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: p.value }}
                      onClick={() =>
                        patchAppearance({
                          header_bg_color: p.value,
                          hero_bg_color: p.value,
                        })
                      }
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2 rounded-xl border border-[#E7EAF0] bg-white p-3">
              <p className="text-xs font-semibold text-[#153E73]">內容編輯</p>
              <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                <li>調整顯示／排序後按「儲存草稿」</li>
                <li>開啟進階編輯修改素材內容（即時上線）</li>
                <li>版面就緒後按「發布上線」</li>
              </ol>
            </div>

            <Link
              href={selected.href}
              className={cn(
                buttonVariants({ size: "default" }),
                "inline-flex w-full justify-center border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73] hover:bg-[#FFE149]/90 sm:w-auto"
              )}
            >
              進階編輯
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewKey((k) => k + 1);
                  setMobileTab("preview");
                }}
              >
                重新整理預覽
              </Button>
              <Link
                href={previewHref}
                target="_blank"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                新分頁草稿預覽
              </Link>
            </div>
          </div>
        </CmsSettingsPanel>
      }
      preview={
        <CmsLivePreview
          title="商城預覽（草稿）"
          src={previewHref}
          reloadKey={previewKey}
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
          fullPreviewHref={previewHref}
          highlightLabel={selected.label}
        />
      }
      footer={
        <div className="flex flex-wrap gap-2 lg:hidden">
          <Button
            className="flex-1 border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73]"
            disabled={!dirty || status === "saving"}
            onClick={() => void saveDraft()}
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
