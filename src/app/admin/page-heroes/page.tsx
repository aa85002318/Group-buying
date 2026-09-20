"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BannerSlotManager } from "@/components/admin/banners/BannerSlotManager";
import {
  PAGE_HERO_PAGES,
  PAGE_HERO_SIZE,
  pageHeroPlacement,
  type PageHeroKey,
} from "@/lib/page-heroes";
import { GROUP_BUY_CONSUMER_VISIBLE } from "@/lib/features/group-buy-visibility";
import { cn } from "@/lib/utils";

const DESKTOP = { ...PAGE_HERO_SIZE.desktop, aspect: "banner31" as const, aspectClass: "aspect-[3/1]" };
const MOBILE = { ...PAGE_HERO_SIZE.mobile, aspect: "photo32" as const, aspectClass: "aspect-[3/2]" };

function PageHeroesAdmin() {
  const router = useRouter();
  const params = useSearchParams();
  const pageKey = (params.get("page") as PageHeroKey) || "shop";
  const page = PAGE_HERO_PAGES.find((p) => p.key === pageKey) ?? PAGE_HERO_PAGES[0]!;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 py-2 md:px-0">
      <AdminPageHeader
        title="各頁 Hero Banner"
        description={`每一頁最上方的大圖。只有圖片和連結，不放文字。所有頁面同一個尺寸：電腦版 ${PAGE_HERO_SIZE.desktop.width}×${PAGE_HERO_SIZE.desktop.height}（${PAGE_HERO_SIZE.desktop.ratio}），手機版可另外上傳 ${PAGE_HERO_SIZE.mobile.width}×${PAGE_HERO_SIZE.mobile.height}（${PAGE_HERO_SIZE.mobile.ratio}）。放多張會自動輪播；修改會立即生效。`}
      />

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-[#E7EAF0] bg-white p-1" aria-label="選擇頁面">
        {PAGE_HERO_PAGES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => router.replace(`/admin/page-heroes?page=${p.key}`)}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition",
              p.key === page.key ? "bg-[#FEE169] text-[#153E73]" : "text-[#687386] hover:bg-[#FFFDF6]"
            )}
          >
            {p.label}
          </button>
        ))}
      </nav>

      <p className="text-sm text-[#687386]">
        頁面：<span className="font-semibold text-[#153E73]">{page.label}</span>
        <a href={page.path} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-[#79C7E8] hover:underline">
          {page.path}
          <ExternalLink className="h-3 w-3" />
        </a>
        {page.key === "group_buy" && !GROUP_BUY_CONSUMER_VISIBLE ? (
          <span className="ml-2 text-xs text-[#8A94A6]">（團購目前未對外，可先準備）</span>
        ) : null}
        {page.fallbackImage ? (
          <span className="ml-2 text-xs text-[#8A94A6]">（還沒上傳時顯示預設圖片）</span>
        ) : null}
      </p>

      <BannerSlotManager
        key={page.key}
        placement={pageHeroPlacement(page.key)}
        label={`${page.label} Hero`}
        desktop={DESKTOP}
        mobile={MOBILE}
        uploadFolder={`banners/page-hero/${page.key}`}
      />
    </div>
  );
}

export default function AdminPageHeroesPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#8A94A6]">載入中…</p>}>
      <PageHeroesAdmin />
    </Suspense>
  );
}
