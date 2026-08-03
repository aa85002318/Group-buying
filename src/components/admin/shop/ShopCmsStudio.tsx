"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
import { cn } from "@/lib/utils";

type ShopSectionDef = {
  id: string;
  label: string;
  description: string;
  href: string;
  group: "main" | "extra";
};

const SHOP_SECTIONS: ShopSectionDef[] = [
  {
    id: "categories",
    label: "商品分類",
    description: "搜尋欄下方圓形主分類：文字、logo、色卡。",
    href: "/admin/shop/categories",
    group: "main",
  },
  {
    id: "features",
    label: "三格特色",
    description: "固定 3 格 banner 圖（無區塊標題）。",
    href: "/admin/shop/features",
    group: "main",
  },
  {
    id: "promo",
    label: "活動 Banner",
    description: "5:2 活動輪播，可新增多張。",
    href: "/admin/shop/promo-banners",
    group: "main",
  },
  {
    id: "popular",
    label: "熱門商品",
    description: "依商城主分類自動排序預覽。",
    href: "/admin/shop/popular-products",
    group: "main",
  },
  {
    id: "new",
    label: "新品上架",
    description: "依新品旗標／上架時間自動排序。",
    href: "/admin/shop/new-products",
    group: "main",
  },
  {
    id: "inspiration",
    label: "烘焙靈感牆",
    description: "精選食譜、滿版 banner、排序。",
    href: "/admin/shop/inspiration",
    group: "main",
  },
  {
    id: "recipe-categories",
    label: "食譜分類",
    description: "靈感牆分類與上方圖案。",
    href: "/admin/shop/recipe-categories",
    group: "main",
  },
  {
    id: "info-banners",
    label: "訂購／企業 Banner",
    description: "兩張 5:2：訂購須知與企業詢問。",
    href: "/admin/shop/info-banners",
    group: "main",
  },
  {
    id: "appearance",
    label: "頁首／Hero 外觀",
    description: "頁首底色、Hero 底色銜接。",
    href: "/admin/shop/appearance",
    group: "extra",
  },
  {
    id: "hero",
    label: "商城 Hero Banner",
    description: "滿寬主視覺圖，高度隨圖。",
    href: "/admin/shop/hero-banners",
    group: "extra",
  },
  {
    id: "ai-assistant",
    label: "AI 助手卡",
    description: "商城內暖黃 AI 功能卡（不是 /ai 頁）。",
    href: "/admin/shop/ai-assistant",
    group: "extra",
  },
  {
    id: "ai-chips",
    label: "AI 推薦 Chip",
    description: "商城 AI 推薦快捷 chip。",
    href: "/admin/shop/ai-chips",
    group: "extra",
  },
];

export function ShopCmsStudio() {
  const [selectedId, setSelectedId] = useState<string>(SHOP_SECTIONS[0]!.id);
  const [previewDevice, setPreviewDevice] = useState<CmsDevice>("mobile");
  const [previewKey, setPreviewKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<"sections" | "edit" | "preview">("sections");
  const [sectionOrder, setSectionOrder] = useState(
    () => SHOP_SECTIONS.filter((s) => s.group === "main").map((s) => s.id)
  );
  const status: CmsSaveStatus = "idle";

  const mainDefs = useMemo(() => {
    const byId = new Map(SHOP_SECTIONS.map((s) => [s.id, s]));
    return sectionOrder
      .map((id) => byId.get(id))
      .filter((s): s is ShopSectionDef => Boolean(s) && s!.group === "main");
  }, [sectionOrder]);

  const extraDefs = SHOP_SECTIONS.filter((s) => s.group === "extra");
  const selected = SHOP_SECTIONS.find((s) => s.id === selectedId) ?? SHOP_SECTIONS[0]!;

  const listItems = [
    ...mainDefs.map((s, i) => ({
      id: s.id,
      label: `${i + 1}. ${s.label}`,
      enabled: true,
      subtitle: s.description,
    })),
  ];

  return (
    <CmsStudioShell
      mobileTab={mobileTab}
      onMobileTabChange={setMobileTab}
      header={
        <CmsStudioHeader
          title="商城 CMS"
          description="依 /shop 區塊順序管理。細項頁保留完整編輯器；此 Hub 負責導覽與預覽。商城 AI 卡 ≠ /ai 頁。"
          status={status}
          actions={
            <Link href="/shop" target="_blank" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              <ExternalLink className="mr-1 h-3.5 w-3.5" />
              前台商城
            </Link>
          }
        />
      }
      sectionList={
        <div className="flex h-full min-h-0 flex-col">
          <CmsSectionList
            title="商城頁面區塊"
            items={listItems}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setMobileTab("edit");
            }}
            onReorder={(ids) => setSectionOrder(ids)}
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
                    onClick={() => {
                      setSelectedId(s.id);
                      setMobileTab("edit");
                    }}
                  >
                    {s.label}
                  </button>
                ))}
                <p className="text-[11px] text-muted-foreground">
                  Hub 排序僅供編輯導覽；實際前台區塊順序以各細項資料為準。
                </p>
              </div>
            }
          />
        </div>
      }
      settingsPanel={
        <CmsSettingsPanel title={selected.label} subtitle={selected.description}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{selected.description}</p>
            <Link
              href={selected.href}
              className={cn(
                buttonVariants({ size: "default" }),
                "inline-flex border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73] hover:bg-[#FFE149]/90"
              )}
            >
              進階編輯
            </Link>
            <div className="rounded-xl border border-[#E7EAF0] bg-[#F7F8FA] p-3 text-xs text-muted-foreground">
              細項路由：<code className="text-[#153E73]">{selected.href}</code>
              <br />
              此頁保留完整 CRUD；側欄已隱藏細項，請由此 Hub 進入。
            </div>
            {selected.group === "extra" && selected.id.startsWith("ai") ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                這是商城首頁內的 AI 卡片設定，不是獨立的 /ai 頁 CMS。
              </p>
            ) : null}
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
          </div>
        </CmsSettingsPanel>
      }
      preview={
        <CmsLivePreview
          title="商城預覽"
          src={`/shop?v=${previewKey}`}
          reloadKey={previewKey}
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
          fullPreviewHref="/shop"
          highlightLabel={selected.label}
        />
      }
      footer={
        <div className="flex flex-wrap gap-2 lg:hidden">
          <Link
            href={selected.href}
            className={cn(
              buttonVariants({ size: "default" }),
              "flex-1 justify-center border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73]"
            )}
          >
            進階編輯
          </Link>
          <Button variant="outline" className="flex-1" onClick={() => setMobileTab("preview")}>
            預覽
          </Button>
        </div>
      }
    />
  );
}
