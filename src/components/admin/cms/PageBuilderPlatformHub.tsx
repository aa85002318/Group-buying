"use client";

import Link from "next/link";
import { Monitor, Smartphone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PAGE_BUILDER_BASE,
  PAGE_BUILDER_GROUPS,
  isPageWirable,
  pageBuilderHref,
  type PageBuilderPlatform,
} from "@/lib/cms/page-builder";
import { getPageRegistryEntry } from "@/lib/cms/page-registry";

const DESKTOP_CHROME_LINKS = [
  {
    href: "/admin/settings/branding",
    title: "Header／Logo",
    desc: "網頁版 Logo（文字在右側）· 不含 Header IP",
  },
  {
    href: "/admin/layout-settings/desktop/footer",
    title: "Footer",
    desc: "網頁版頁尾文案、連結、社群",
  },
  {
    href: "/admin/banners?placement=desktop_home_hero",
    title: "首頁 Banner 16:9",
    desc: "Desktop 首頁純圖 Banner",
  },
  {
    href: "/admin/content/popups",
    title: "全站公告",
    desc: "Announcement（內容共用）",
  },
] as const;

export function PageBuilderPlatformHub({
  platform,
}: {
  platform: PageBuilderPlatform;
}) {
  const isDesktop = platform === "desktop";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-[#8A94A6]">
            <Link href={PAGE_BUILDER_BASE} className="hover:text-[#153E73] hover:underline">
              前台內容編輯器
            </Link>
            <span>/</span>
            <span className="text-[#153E73]">
              {isDesktop ? "網頁版 Desktop" : "手機 App / Mobile"}
            </span>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[#153E73]">
            {isDesktop ? (
              <Monitor className="h-6 w-6" />
            ) : (
              <Smartphone className="h-6 w-6" />
            )}
            {isDesktop ? "網頁版設定" : "手機 App 設定"}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[#687386]">
            {isDesktop
              ? "此管道只顯示 Desktop 版型。內容共用 · 版型獨立。"
              : "此管道只顯示 Mobile／App 版型。內容共用 · 版型獨立。現有手機 UI 第一階段不破壞。"}
          </p>
        </div>
        <Link
          href={
            isDesktop
              ? `${PAGE_BUILDER_BASE}/mobile`
              : `${PAGE_BUILDER_BASE}/desktop`
          }
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          切換到{isDesktop ? "手機 App" : "網頁版"}
        </Link>
      </div>

      <div className="rounded-[12px] border border-[#E9EDF2] bg-white px-3 py-2 text-xs text-[#687386]">
        <span className="font-semibold text-[#153E73]">內容共用</span>
        {" · "}
        <span className="font-semibold text-[#153E73]">版型獨立</span>
        {" · "}
        {isDesktop ? "發布只影響 Desktop" : "發布只影響 Mobile"}
      </div>

      {isDesktop ? (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#153E73]">全站（網頁版）</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {DESKTOP_CHROME_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[14px] border border-[#E9EDF2] bg-white p-4 transition hover:border-[#153E73]/25 hover:bg-[#FFFDF6]"
              >
                <p className="font-semibold text-[#153E73]">{item.title}</p>
                <p className="mt-1 text-xs text-[#687386]">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {PAGE_BUILDER_GROUPS.map((group) => {
        if (group.id === "global" && isDesktop) return null;
        const pages = group.pageIds
          .map((id) => getPageRegistryEntry(id))
          .filter(Boolean);
        if (!pages.length) return null;
        return (
          <section key={group.id} className="space-y-2">
            <h2 className="text-sm font-bold text-[#153E73]">{group.label}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((page) => {
                if (!page) return null;
                const wirable = isPageWirable(page.id, platform);
                return (
                  <Link
                    key={page.id}
                    href={pageBuilderHref(page.id, platform)}
                    className="rounded-[14px] border border-[#E9EDF2] bg-white p-4 transition hover:border-[#153E73]/25 hover:bg-[#FFFDF6]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#153E73]">{page.name}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-[#8A94A6]">
                          {page.slug}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          wirable
                            ? "bg-[#E8F8EF] text-[#1B6B3A]"
                            : "bg-[#F3F4F6] text-[#6B7280]"
                        )}
                      >
                        {wirable ? "可編輯" : "預留"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
