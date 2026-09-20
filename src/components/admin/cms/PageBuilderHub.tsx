"use client";

import Link from "next/link";
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  Megaphone,
  PanelBottom,
  PanelTop,
  ShoppingBag,
} from "lucide-react";
import { pageBuilderHref } from "@/lib/cms/page-builder";
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
    href: "/admin/page-heroes",
    title: "各頁 Hero Banner",
    desc: "商城、食譜等各頁最上方大圖（圖片＋連結）",
    icon: ImagePlus,
  },
  {
    href: "/admin/banners",
    title: "共用 Banner",
    desc: "各頁輪播大圖（網頁、手機共用）",
    icon: ImagePlus,
  },
  {
    href: "/admin/website-nav",
    title: "頁首選單",
    desc: "新增、排序網站上方的選單",
    icon: PanelTop,
  },
  {
    href: "/admin/layout-settings/desktop/footer",
    title: "頁尾",
    desc: "頁尾文案、連結欄、社群與版權",
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

/**
 * Single entry for storefront editing: pick the page as customers see it,
 * then the platform. Badges say plainly whether publishing reaches the site.
 */
export function PageBuilderHub() {
  const livePages = LIVE_PAGE_ORDER.map((id) => getPageRegistryEntry(id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p)
  );
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-1 py-4">
      <div>
        <h1 className="text-2xl font-bold text-[#153E73]">前台內容編輯器</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#687386]">
          每一頁只有一個版本，電腦和手機會自動依螢幕大小排版。編輯時可以新增、排序、隱藏區塊，
          儲存草稿後可以預覽，按「發布」才會出現在網站上。商品、食譜、文章等內容請到各自的管理頁修改。
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
                <Link
                  href={pageBuilderHref(page.id, "mobile")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#153E73] px-4 text-sm font-semibold text-white transition hover:bg-[#153E73]/90"
                >
                  編輯這一頁
                </Link>
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

    </div>
  );
}
