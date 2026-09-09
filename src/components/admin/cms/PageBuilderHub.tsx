"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Monitor, Smartphone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PAGE_BUILDER_BASE,
  PAGE_BUILDER_DESKTOP_WIRABLE,
  PAGE_BUILDER_GROUPS,
  PAGE_BUILDER_MOBILE_WIRABLE,
  pageBuilderHref,
} from "@/lib/cms/page-builder";
import {
  CMS_PAGE_REGISTRY,
  getPageRegistryEntry,
  type CmsPageRegistryEntry,
} from "@/lib/cms/page-registry";
import type { CmsPublishState } from "@/types/cms";

type StatusMap = Record<
  string,
  {
    publishState: CmsPublishState;
    blockCount?: number;
    draftVersion?: number;
  }
>;

const STATUS_LABEL: Record<CmsPublishState, string> = {
  published: "已發布",
  unpublished_changes: "有未發布草稿",
  draft_saved: "草稿已儲存",
  local_dirty: "本機未儲存",
  publish_failed: "發布失敗",
  unset: "尚未設定",
};

function statusTone(state: CmsPublishState) {
  switch (state) {
    case "published":
      return "bg-[#E8F8EF] text-[#1B6B3A]";
    case "unpublished_changes":
    case "draft_saved":
      return "bg-[#FFF5CC] text-[#153E73]";
    case "publish_failed":
      return "bg-[#FDE8E6] text-[#B42318]";
    default:
      return "bg-[#F3F4F6] text-[#6B7280]";
  }
}

function resolveEntry(pageId: string): CmsPageRegistryEntry | undefined {
  return getPageRegistryEntry(pageId);
}

export function PageBuilderHub() {
  const [statuses, setStatuses] = useState<StatusMap>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: StatusMap = {};
      try {
        const home = await fetch("/api/admin/cms?type=blocks&source=draft").then(
          (r) => r.json()
        );
        if (Array.isArray(home.blocks)) {
          next.home = {
            publishState: "unpublished_changes",
            blockCount: home.blocks.length,
          };
        }
      } catch {
        /* ignore */
      }
      try {
        const shop = await fetch("/api/admin/shop/layout").then((r) => r.json());
        if (shop.draft) {
          next.shop = {
            publishState: "unpublished_changes",
            draftVersion: shop.draft.version_number,
            blockCount: shop.settings?.sectionOrder?.length,
          };
        }
      } catch {
        /* ignore */
      }
      try {
        const desk = await fetch(
          "/api/admin/desktop-layout?page_key=home"
        ).then((r) => r.json());
        if (desk.draft?.rows) {
          next["home:desktop"] = {
            publishState: "unpublished_changes",
            draftVersion: desk.draft.version_number,
            blockCount: desk.draft.rows.length,
          };
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setStatuses(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    return PAGE_BUILDER_GROUPS.map((g) => ({
      ...g,
      pages: g.pageIds
        .map((id) => resolveEntry(id))
        .filter(Boolean) as CmsPageRegistryEntry[],
    })).filter((g) => g.pages.length > 0);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#153E73]">雙版型 Page Builder</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#687386]">
            內容資料共用；Desktop / Mobile 只分開版型設定。頂部切換版型後，同一個模組面板只顯示該版型設定。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/frontend-cms"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            舊版 CMS 中心
          </Link>
          <Link
            href="/admin/layout-settings/desktop"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Desktop 版型（經典）
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[14px] border border-[#E9EDF2] bg-white p-3 text-xs text-[#687386]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF8FC] px-2.5 py-1 font-semibold text-[#153E73]">
          <Monitor className="h-3.5 w-3.5" />
          Desktop ≥1024
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF5CC] px-2.5 py-1 font-semibold text-[#153E73]">
          <Smartphone className="h-3.5 w-3.5" />
          Mobile / App（不改現有 UI）
        </span>
        <span>草稿 → 預覽 → 發佈；不會自動上線。</span>
      </div>

      {groups.map((group) => (
        <section key={group.id} className="space-y-3">
          <h2 className="text-sm font-bold text-[#153E73]">{group.label}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.pages.map((page) => {
              const mobileOk = PAGE_BUILDER_MOBILE_WIRABLE.has(page.id);
              const desktopOk = PAGE_BUILDER_DESKTOP_WIRABLE.has(page.id);
              const st =
                statuses[page.id] ??
                (page.hasLayoutCms
                  ? { publishState: "published" as const }
                  : { publishState: "unset" as const });
              return (
                <div
                  key={page.id}
                  className="rounded-[16px] border border-[#E9EDF2] bg-white p-4 shadow-[0_1px_0_rgba(21,62,115,0.04)]"
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
                        statusTone(st.publishState)
                      )}
                    >
                      {STATUS_LABEL[st.publishState]}
                    </span>
                  </div>
                  {page.description ? (
                    <p className="mt-2 text-xs text-[#687386]">{page.description}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-medium",
                        mobileOk
                          ? "bg-[#E8F8EF] text-[#1B6B3A]"
                          : "bg-[#F3F4F6] text-[#6B7280]"
                      )}
                    >
                      Mobile {mobileOk ? "可編輯" : "預留"}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-medium",
                        desktopOk
                          ? "bg-[#EEF8FC] text-[#153E73]"
                          : "bg-[#F3F4F6] text-[#6B7280]"
                      )}
                    >
                      Desktop {desktopOk ? "可編輯" : "預留"}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={pageBuilderHref(page.id)}
                      className={buttonVariants({
                        size: "sm",
                        className:
                          "w-full border-[#FFD454] bg-[#FFD454] text-[#153E73] hover:bg-[#FFD454]/90",
                      })}
                    >
                      開啟編輯器
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="text-xs text-[#8A94A6]">
        路徑：{PAGE_BUILDER_BASE} · 登錄頁共{" "}
        {CMS_PAGE_REGISTRY.length} 筆（含舊版畫布頁）
      </p>
    </div>
  );
}
