"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CmsSettingsTabId =
  | "content"
  | "layout"
  | "display"
  | "links"
  | "schedule";

const TAB_LABELS: Record<CmsSettingsTabId, string> = {
  content: "內容設定",
  layout: "版型設定",
  display: "顯示設定",
  links: "連結設定",
  schedule: "排程設定",
};

export function CmsSettingsTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: CmsSettingsTabId[];
  active: CmsSettingsTabId;
  onChange: (tab: CmsSettingsTabId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-[#E8EBF0] px-2 pt-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={cn(
            "rounded-t-lg px-3 py-2 text-[13px] font-semibold",
            active === tab
              ? "bg-[#FFF5C7] text-[#153E73]"
              : "text-[#153E73]/60 hover:bg-[#FFFBEA]"
          )}
          onClick={() => onChange(tab)}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}

export function CmsSettingsPanel({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  children,
  empty,
}: {
  title?: string;
  subtitle?: string;
  tabs?: CmsSettingsTabId[];
  activeTab?: CmsSettingsTabId;
  onTabChange?: (tab: CmsSettingsTabId) => void;
  children?: ReactNode;
  empty?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[#E8EBF0] px-3 py-2">
        <p className="text-sm font-semibold text-[#153E73]">{title || "區塊設定"}</p>
        {subtitle ? <p className="text-[11px] text-muted-foreground">{subtitle}</p> : null}
      </div>
      {tabs && activeTab && onTabChange ? (
        <CmsSettingsTabs tabs={tabs} active={activeTab} onChange={onTabChange} />
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {children ?? empty ?? (
          <p className="text-sm text-muted-foreground">請從左側選擇區塊</p>
        )}
      </div>
    </div>
  );
}
