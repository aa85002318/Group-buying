"use client";

import Link from "next/link";
import { DesktopInnerPageLayout } from "@/components/desktop/layout/DesktopInnerPageLayout";
import { AI_SIDEBAR_ITEMS, INNER_PAGE_HEROES } from "@/lib/desktop/inner-page-config";
import { APP_ROUTES } from "@/lib/site-links";

/** Desktop shell for AI hub — embeds existing /ai experience via link cards + iframe-free CTA. */
export function DesktopAi() {
  return (
    <DesktopInnerPageLayout
      hero={INNER_PAGE_HEROES.ai}
      breadcrumb={[
        { label: "首頁", href: APP_ROUTES.home },
        { label: "AI助手" },
      ]}
      sidebar={{
        title: "AI 服務",
        items: AI_SIDEBAR_ITEMS,
        activeKey: "chat",
      }}
      toolbar={{
        title: "AI 烘焙助手",
        description: "詢問配方、材料比例與烘焙建議，快速找到靈感。",
      }}
    >
      <div className="space-y-4 rounded-[16px] border border-[#E9EDF2] bg-white p-6">
        <p className="text-sm leading-relaxed text-[#687386]">
          點擊下方開始對話，進入完整 AI 助手體驗（登入狀態、對話紀錄與上傳功能與 Mobile 共用同一套邏輯）。
        </p>
        <Link
          href="/ai?desktop_chat=1"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#153E73] px-6 text-sm font-bold text-white"
        >
          開始對話
        </Link>
        <div className="grid gap-3 pt-2 sm:grid-cols-3">
          {[
            ["問配方", "蛋糕、麵包、餅乾比例建議"],
            ["找材料", "依食譜推薦商城商品"],
            ["排除問題", "烤焙失敗常見排查"],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl bg-[#EEF8FC] p-4">
              <p className="font-bold text-[#153E73]">{t}</p>
              <p className="mt-1 text-sm text-[#687386]">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </DesktopInnerPageLayout>
  );
}
