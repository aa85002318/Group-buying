"use client";

import { CmsVersionPublishBar } from "@/components/admin/cms-studio";

/** @deprecated Prefer CmsVersionPublishBar — kept for existing imports. */
export function HomeLayoutPublishBar({ onChanged }: { onChanged?: () => void }) {
  return (
    <CmsVersionPublishBar
      apiPath="/api/admin/home/layout"
      title="版面發布"
      description="區塊變更先寫入草稿，發布後才會影響前台。訪客只會看到已發布版。"
      previewHref="/?preview=draft"
      publishConfirm="確定發布草稿到線上首頁？"
      onChanged={onChanged}
    />
  );
}
