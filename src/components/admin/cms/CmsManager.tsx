"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import {
  CMS_PAGE_REGISTRY,
  type CmsPageRegistryEntry,
} from "@/lib/cms/page-registry";
import { cn } from "@/lib/utils";
import type { CmsPublishState } from "@/types/cms";

export type CmsManagerStatusMap = Record<
  string,
  {
    publishState: CmsPublishState;
    blockCount?: number;
    updatedAt?: string;
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

export function CmsManager({ statuses }: { statuses?: CmsManagerStatusMap }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("全部");

  const categories = useMemo(() => {
    const set = new Set(CMS_PAGE_REGISTRY.map((p) => p.categoryGroup));
    return ["全部", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return CMS_PAGE_REGISTRY.filter((p) => {
      if (category !== "全部" && p.categoryGroup !== category) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.slug.toLowerCase().includes(needle) ||
        p.id.toLowerCase().includes(needle) ||
        (p.description ?? "").toLowerCase().includes(needle)
      );
    });
  }, [q, category]);

  const grouped = useMemo(() => {
    const map: Record<string, CmsPageRegistryEntry[]> = {};
    for (const p of filtered) {
      const list = map[p.categoryGroup] ?? [];
      list.push(p);
      map[p.categoryGroup] = list;
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#153E73]">前台內容管理</h1>
        <p className="mt-1 text-sm text-[#8A94A6]">
          全站版型／區塊／共用元件一覽。有版型的頁面可開啟畫布編輯器；尚未設定者僅預留入口。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#8A94A6]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋頁面名稱、路徑…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                category === c
                  ? "bg-[#FFE149] text-[#153E73]"
                  : "bg-white text-[#153E73]/70 ring-1 ring-[#E7EAF0] hover:bg-[#FFF7CC]"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([group, pages]) => (
          <section key={group}>
            <h2 className="mb-3 text-sm font-bold text-[#153E73]">{group}</h2>
            <div className="overflow-hidden rounded-[18px] border border-[#E7EAF0] bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FFFDF6] text-[11px] uppercase tracking-wide text-[#8A94A6]">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">頁面</th>
                    <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                      路徑
                    </th>
                    <th className="px-4 py-2.5 font-semibold">狀態</th>
                    <th className="hidden px-4 py-2.5 font-semibold md:table-cell">
                      區塊
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5]">
                  {pages.map((p) => {
                    const st = statuses?.[p.id];
                    const publishState: CmsPublishState =
                      st?.publishState ??
                      (p.hasLayoutCms ? "published" : "unset");
                    return (
                      <tr key={p.id} className="hover:bg-[#FFFDF6]/80">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#153E73]">{p.name}</p>
                          {p.description ? (
                            <p className="text-[11px] text-[#8A94A6]">
                              {p.description}
                            </p>
                          ) : null}
                        </td>
                        <td className="hidden px-4 py-3 font-mono text-xs text-[#8A94A6] sm:table-cell">
                          {p.slug}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              statusTone(publishState)
                            )}
                          >
                            {STATUS_LABEL[publishState]}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-[#8A94A6] md:table-cell">
                          {st?.blockCount != null
                            ? st.blockCount
                            : p.hasLayoutCms
                              ? "—"
                              : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={p.editHref}
                            className={buttonVariants({
                              size: "sm",
                              variant: p.hasLayoutCms ? "default" : "outline",
                              className: p.hasLayoutCms
                                ? "border-[#FFE149] bg-[#FFE149] text-[#153E73] hover:bg-[#FFE149]/90"
                                : undefined,
                            })}
                          >
                            {p.hasLayoutCms ? "開啟畫布" : "檢視預留"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        {filtered.length === 0 ? (
          <p className="text-sm text-[#8A94A6]">沒有符合的頁面</p>
        ) : null}
      </div>
    </div>
  );
}

/** Client wrapper that probes known layout APIs for status chips. */
export function CmsManagerWithLiveStatus() {
  const [statuses, setStatuses] = useState<CmsManagerStatusMap>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: CmsManagerStatusMap = {};
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
            updatedAt: shop.draft.updated_at,
            blockCount: shop.settings?.sectionOrder?.length,
          };
        }
      } catch {
        /* ignore */
      }
      try {
        const gb = await fetch("/api/admin/group-buy/page-settings").then((r) =>
          r.json()
        );
        if (gb.draft) {
          next.group_buy = {
            publishState: "unpublished_changes",
            draftVersion: gb.draft.version_number,
            updatedAt: gb.draft.updated_at,
            blockCount: gb.settings?.sectionOrder?.length,
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

  return <CmsManager statuses={statuses} />;
}
