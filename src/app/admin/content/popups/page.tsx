"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  clickRate,
  computeDisplayStatus,
  type HomepagePopup,
  type HomepagePopupPriority,
  type HomepagePopupStatus,
} from "@/lib/popups/types";
import { formatDate } from "@/lib/utils";

type Row = HomepagePopup & {
  display_status?: HomepagePopupStatus;
  click_rate?: string;
};

function statusVariant(s: HomepagePopupStatus): "success" | "warning" | "primary" | "secondary" {
  if (s === "active") return "success";
  if (s === "scheduled") return "primary";
  if (s === "draft") return "secondary";
  if (s === "disabled" || s === "ended") return "warning";
  return "secondary";
}

export default function AdminPopupsListPage() {
  const [popups, setPopups] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/popups")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setPopups(d.popups ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patchStatus = async (id: string, status: HomepagePopupStatus) => {
    const res = await fetch(`/api/admin/popups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "更新失敗");
      return;
    }
    load();
  };

  const duplicate = async (p: Row) => {
    const res = await fetch("/api/admin/popups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...p,
        internal_name: `${p.internal_name}（副本）`,
        status: "draft",
        id: undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "複製失敗");
      return;
    }
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("確定刪除此公告？相關統計紀錄也會一併刪除。")) return;
    const res = await fetch(`/api/admin/popups/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "刪除失敗");
      return;
    }
    load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="首頁彈跳公告"
        description="管理首頁活動彈窗。同一工作階段最多顯示一則，依優先級選出。"
        actions={
          <Link href="/admin/content/popups/new">
            <Button>新增公告</Button>
          </Link>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button type="button" className="ml-2 underline" onClick={load}>
            重試
          </button>
        </div>
      )}

      <AdminTable
        columns={[
          {
            key: "image",
            header: "圖片",
            render: (p) => {
              const src = p.mobile_image_url || p.desktop_image_url;
              return src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">無</span>
              );
            },
          },
          {
            key: "name",
            header: "公告名稱",
            render: (p) => (
              <div>
                <Link
                  href={`/admin/content/popups/${p.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {p.internal_name}
                </Link>
                <p className="line-clamp-1 text-xs text-muted-foreground">{p.title}</p>
              </div>
            ),
          },
          {
            key: "period",
            header: "顯示期間",
            render: (p) => (
              <span className="text-xs">
                {p.starts_at ? formatDate(p.starts_at) : "—"}
                <br />～ {p.ends_at ? formatDate(p.ends_at) : "—"}
              </span>
            ),
          },
          {
            key: "audience",
            header: "對象",
            render: (p) =>
              p.audience_type === "all"
                ? "全部"
                : p.audience_type === "guest"
                  ? "未登入"
                  : "已登入",
          },
          {
            key: "link",
            header: "連結",
            render: (p) => (
              <span className="line-clamp-1 max-w-[140px] font-mono text-xs">
                {p.link_url || p.link_type}
              </span>
            ),
          },
          {
            key: "status",
            header: "狀態",
            render: (p) => {
              const s = p.display_status ?? computeDisplayStatus(p);
              return (
                <StatusBadge label={STATUS_LABELS[s]} variant={statusVariant(s)} />
              );
            },
          },
          {
            key: "priority",
            header: "優先級",
            render: (p) => PRIORITY_LABELS[p.priority as HomepagePopupPriority] ?? p.priority,
          },
          {
            key: "stats",
            header: "曝光／點擊",
            render: (p) => (
              <span className="text-xs">
                {p.view_count ?? 0}／{p.click_count ?? 0}
                <br />
                CTR {p.click_rate ?? clickRate(p.view_count ?? 0, p.click_count ?? 0)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (p) => (
              <div className="flex flex-wrap justify-end gap-1">
                <Link href={`/admin/content/popups/${p.id}`}>
                  <Button size="sm" variant="secondary">
                    編輯
                  </Button>
                </Link>
                {p.status !== "active" ? (
                  <Button size="sm" variant="outline" onClick={() => patchStatus(p.id, "active")}>
                    立即顯示
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => patchStatus(p.id, "disabled")}
                  >
                    暫停
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => duplicate(p)}>
                  複製
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                  刪除
                </Button>
              </div>
            ),
          },
        ]}
        rows={popups}
        loading={loading}
        emptyText="尚無首頁彈跳公告"
      />
    </div>
  );
}
