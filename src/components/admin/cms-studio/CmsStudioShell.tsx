"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CmsSaveStatusBadge } from "./CmsSaveStatusBadge";
import type { CmsSaveStatus } from "./types";

export function CmsStudioHeader({
  title,
  description,
  status,
  actions,
  notice,
}: {
  title: string;
  description?: string;
  status?: CmsSaveStatus;
  actions?: ReactNode;
  notice?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--admin-title,#153E73)] md:text-2xl">
              {title}
            </h1>
            {status ? <CmsSaveStatusBadge status={status} /> : null}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-[var(--admin-muted,#8A94A6)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      {notice}
    </div>
  );
}

export function CmsStudioShell({
  header,
  mobileTab,
  onMobileTabChange,
  sectionList,
  settingsPanel,
  preview,
  footer,
  className,
}: {
  header: ReactNode;
  mobileTab: "sections" | "edit" | "preview";
  onMobileTabChange: (tab: "sections" | "edit" | "preview") => void;
  sectionList: ReactNode;
  settingsPanel: ReactNode;
  preview: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const tabs = [
    { id: "sections" as const, label: "區塊" },
    { id: "edit" as const, label: "編輯" },
    { id: "preview" as const, label: "預覽" },
  ];

  return (
    <div className={cn("flex min-h-[calc(100dvh-5.5rem)] flex-col gap-4", className)}>
      {header}

      <div className="flex gap-1 rounded-[18px] border border-[var(--admin-border,#ECECEC)] bg-white p-1 shadow-[0_10px_35px_rgba(0,0,0,.05)] lg:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn(
              "flex-1 rounded-[14px] px-3 py-2.5 text-sm font-semibold transition",
              mobileTab === t.id
                ? "bg-[#FFE149] text-[var(--admin-title,#153E73)]"
                : "text-[var(--admin-title,#153E73)]/70 hover:bg-[var(--admin-hover,#FFF7CC)]"
            )}
            onClick={() => onMobileTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[280px_minmax(420px,1fr)_minmax(320px,420px)]">
        <div
          className={cn(
            "min-h-0 overflow-hidden rounded-[24px] border border-[var(--admin-border,#ECECEC)] bg-white shadow-[0_10px_35px_rgba(0,0,0,.05)]",
            mobileTab === "sections" ? "block" : "hidden lg:block"
          )}
        >
          {sectionList}
        </div>
        <div
          className={cn(
            "min-h-0 overflow-hidden rounded-[24px] border border-[var(--admin-border,#ECECEC)] bg-white shadow-[0_10px_35px_rgba(0,0,0,.05)]",
            mobileTab === "edit" ? "block" : "hidden lg:block"
          )}
        >
          {settingsPanel}
        </div>
        <div
          className={cn(
            "min-h-[480px] overflow-hidden rounded-[24px] border border-[var(--admin-border,#ECECEC)] bg-[#FFFDF6] p-3 shadow-[0_10px_35px_rgba(0,0,0,.05)] lg:min-h-0",
            mobileTab === "preview" ? "block" : "hidden lg:block"
          )}
        >
          {preview}
        </div>
      </div>

      {footer ? (
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-[var(--admin-border)] bg-[rgba(255,253,246,0.95)] px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
