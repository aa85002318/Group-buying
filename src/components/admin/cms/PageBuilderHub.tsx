"use client";

import Link from "next/link";
import {
  ChevronDown,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  Megaphone,
  Monitor,
  PanelBottom,
  ShoppingBag,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PAGE_BUILDER_GROUPS,
  isPageLive,
  isPageUnified,
  isPageWirable,
  pageBuilderHref,
  type PageBuilderPlatform,
} from "@/lib/cms/page-builder";
import { getPageRegistryEntry } from "@/lib/cms/page-registry";

/** Pages that are live on at least one platform, in storefront order. */
const LIVE_PAGE_ORDER = ["home", "shop", "group_buy"] as const;

const SITE_WIDE_LINKS = [
  {
    href: "/admin/content/popups",
    title: "全站公告",
    desc: "首頁彈窗與公告訊息",
    icon: Megaphone,
  },
  {
    href: "/admin/banners",
    title: "共用 Banner",
    desc: "各頁輪播大圖（網頁、手機共用）",
    icon: ImagePlus,
  },
  {
    href: "/admin/layout-settings/desktop/footer",
    title: "網頁版頁尾",
    desc: "頁尾文案、連結與社群",
    icon: PanelBottom,
  },
  {
    href: "/admin/settings/branding",
    title: "Logo／品牌素材",
    desc: "頁首 Logo、App 圖示",
    icon: ImageIcon,
  },
  {
    href: "/admin/group-buy/settings",
    title: "團購頁設定",
    desc: "團購頁主視覺、分頁與排序",
    icon: ShoppingBag,
  },
  {
    href: "/admin/site-pages",
    title: "說明與法務頁",
    desc: "配送說明、常見問題、條款、隱私權",
    icon: FileText,
  },
] as const;

function PlatformAction({
  pageId,
  platform,
}: {
  pageId: string;
  platform: PageBuilderPlatform;
}) {
  const live = isPageLive(pageId, platform);
  const editable = live || isPageWirable(pageId, platform);
  const Icon = platform === "desktop" ? Monitor : Smartphone;
  const label = platform === "desktop" ? "網頁版" : "手機版";

  if (!editable) {
    return (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-[#E4E7EC] px-3 text-xs text-[#98A2B3]">
        <Icon className="h-3.5 w-3.5" />
        {label}：尚未開放
      </span>
    );
  }

  return (
    <Link
      href={pageBuilderHref(pageId, platform)}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition",
        live
          ? "bg-[#153E73] text-white hover:bg-[#153E73]/90"
          : "border border-[#E4E7EC] bg-white text-[#687386] hover:bg-[#FFFDF6]"
      )}
      title={live ? undefined : "可以編排，但發布後網站不會改變"}
    >
      <Icon className="h-3.5 w-3.5" />
      編輯{label}
      {live ? null : <span className="text-[11px] font-normal">（未連動）</span>}
    </Link>
  );
}

/**
 * Single entry for storefront editing: pick the page as customers see it,
 * then the platform. Badges say plainly whether publishing reaches the site.
 */
export function PageBuilderHub() {
  const livePages = LIVE_PAGE_ORDER.map((id) => getPageRegistryEntry(id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p)
  );
  const liveIds = new Set<string>(LIVE_PAGE_ORDER);
  const otherPages = PAGE_BUILDER_GROUPS.flatMap((g) => g.pageIds)
    .filter((id) => !liveIds.has(id))
    .map((id) => getPageRegistryEntry(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .filter((p) => isPageWirable(p.id, "desktop") || isPageWirable(p.id, "mobile"));
  const reservedCount =
    PAGE_BUILDER_GROUPS.flatMap((g) => g.pageIds).filter((id) => !liveIds.has(id)).length -
    otherPages.length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-1 py-4">
      <div>
        <h1 className="text-2xl font-bold text-[#153E73]">前台內容編輯器</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#687386]">
          選擇要修改的頁面。深藍色按鈕的頁面已經連動網站：儲存草稿後可預覽，按「發布」就會出現在前台。
          商品、食譜、文章等內容請到各自的管理頁修改，這裡只調整頁面的區塊與排列。
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#153E73]">頁面</h2>
        <div className="divide-y divide-[#EEF0F4] overflow-hidden rounded-2xl border border-[#E9EDF2] bg-white">
          {livePages.map((page) => (
            <div
              key={page.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[#153E73]">{page.name}</p>
                <a
                  href={page.previewPath}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#8A94A6] hover:text-[#153E73]"
                >
                  {page.previewPath}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                {isPageUnified(page.id) ? (
                  <Link
                    href={pageBuilderHref(page.id, "mobile")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#153E73] px-3 text-sm font-semibold text-white transition hover:bg-[#153E73]/90"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <Monitor className="h-3.5 w-3.5" />
                    編輯（手機＋網頁一次改）
                  </Link>
                ) : (
                  <>
                    <PlatformAction pageId={page.id} platform="desktop" />
                    <PlatformAction pageId={page.id} platform="mobile" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#153E73]">全站共用</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SITE_WIDE_LINKS.map(({ href, title, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 rounded-2xl border border-[#E9EDF2] bg-white p-4 transition hover:border-[#FEE169] hover:bg-[#FFFDF6]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF5CC] text-[#153E73]">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-[#153E73]">{title}</span>
                <span className="mt-0.5 block text-xs text-[#687386]">{desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {otherPages.length ? (
        <details className="group rounded-2xl border border-dashed border-[#E4E7EC] bg-[#FAFBFC] p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[#687386]">
            <span>
              尚未連動網站的頁面（{otherPages.length}）
              <span className="ml-2 font-normal text-[#98A2B3]">
                可以先編排，但發布後前台不會改變
              </span>
            </span>
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </summary>
          <div className="mt-3 divide-y divide-[#EEF0F4] overflow-hidden rounded-xl border border-[#E9EDF2] bg-white">
            {otherPages.map((page) => (
              <div
                key={page.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm font-semibold text-[#153E73]">{page.name}</p>
                <div className="flex flex-wrap gap-2">
                  <PlatformAction pageId={page.id} platform="desktop" />
                  <PlatformAction pageId={page.id} platform="mobile" />
                </div>
              </div>
            ))}
          </div>
          {reservedCount > 0 ? (
            <p className="mt-2 text-xs text-[#98A2B3]">
              另有 {reservedCount} 個頁面（購物車、結帳、會員、FAQ 等）目前由程式固定排版，之後開放再顯示於此。
            </p>
          ) : null}
        </details>
      ) : null}
    </div>
  );
}
