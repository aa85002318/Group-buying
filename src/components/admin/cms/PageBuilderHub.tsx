"use client";

import Link from "next/link";
import { Monitor, Smartphone, Settings2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  PAGE_BUILDER_BASE,
  pageBuilderPlatformHref,
} from "@/lib/cms/page-builder";

/**
 * Root hub: choose Desktop or Mobile pipeline (two independent settings channels).
 */
export function PageBuilderHub() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-1 py-4">
      <div>
        <h1 className="text-2xl font-bold text-[#153E73]">前台內容編輯器</h1>
        <p className="mt-1 text-sm text-[#687386]">
          選擇要編輯的版型管道。內容共用 · 版型獨立。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={pageBuilderPlatformHref("desktop")}
          className="rounded-[16px] border border-[#E9EDF2] bg-white p-5 shadow-[0_1px_0_rgba(21,62,115,0.04)] transition hover:border-[#153E73]/30 hover:bg-[#FFFDF6]"
        >
          <Monitor className="mb-3 h-8 w-8 text-[#153E73]" />
          <p className="text-lg font-bold text-[#153E73]">🖥 網頁版設定</p>
          <p className="mt-1 text-sm text-[#687386]">
            Desktop ≥1024。只顯示網頁版型欄位；發布只影響 Desktop。
          </p>
        </Link>

        <Link
          href={pageBuilderPlatformHref("mobile")}
          className="rounded-[16px] border border-[#E9EDF2] bg-white p-5 shadow-[0_1px_0_rgba(21,62,115,0.04)] transition hover:border-[#153E73]/30 hover:bg-[#FFFDF6]"
        >
          <Smartphone className="mb-3 h-8 w-8 text-[#153E73]" />
          <p className="text-lg font-bold text-[#153E73]">📱 手機 App 設定</p>
          <p className="mt-1 text-sm text-[#687386]">
            Mobile／App。只顯示手機版型欄位；現有手機 UI 第一階段不破壞。
          </p>
        </Link>
      </div>

      <div className="rounded-[14px] border border-[#E9EDF2] bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#153E73]">
          <Settings2 className="h-4 w-4" />
          全站共用資料
        </div>
        <p className="mb-3 text-xs text-[#687386]">
          商品、食譜、活動、Banner、Logo 等內容資料只維護一份。
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/admin/banners", label: "Banner" },
            { href: "/admin/settings/branding", label: "Logo / 品牌素材" },
            { href: "/admin/content/popups", label: "公告" },
            { href: "/admin/products", label: "商品" },
            { href: "/admin/recipes", label: "食譜" },
            { href: "/admin/stores", label: "門市" },
            { href: "/admin/media", label: "素材庫" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs text-[#8A94A6]">路徑：{PAGE_BUILDER_BASE}</p>
    </div>
  );
}
