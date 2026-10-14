"use client";

import AiBakingPage from "@/app/(main)/ai/AiBakingPage";
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
      {/* 網站版直接使用與 App 相同的 AI 助手（工具、對話、購物車都共用）。 */}
      <div className="rounded-[16px] border border-[#E9EDF2] bg-white p-2 sm:p-4">
        <AiBakingPage embedded />
      </div>
    </DesktopInnerPageLayout>
  );
}
