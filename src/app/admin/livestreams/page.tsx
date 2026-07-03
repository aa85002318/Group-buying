"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import { livestreamStatusVariant } from "@/lib/admin/status";
import { formatDate, LIVESTREAM_STATUS_LABELS } from "@/lib/utils";
import type { Livestream } from "@/lib/types/database";

export default function AdminLivestreamsPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<Livestream>(
    "/api/admin/livestreams",
    "livestreams",
    ["title"]
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    stream_url: "",
    status: "scheduled",
    scheduled_at: "",
  });

  const save = async () => {
    await fetch("/api/admin/livestreams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        scheduled_at: form.scheduled_at || new Date().toISOString(),
      }),
    });
    setShowForm(false);
    refresh();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/livestreams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="直播管理"
        description="直播排程與狀態控制"
        actions={<Button onClick={() => setShowForm(true)}>新增直播</Button>}
      />

      {showForm && (
        <div className="rounded-xl bg-white p-4 shadow-card space-y-3">
          <Input placeholder="直播標題" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea
            className="input-field min-h-[80px]"
            placeholder="說明"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input placeholder="串流網址" value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} />
          <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          <div className="flex gap-2">
            <Button onClick={save}>儲存</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              取消
            </Button>
          </div>
        </div>
      )}

      <AdminTable
        columns={[
          { key: "title", header: "標題", render: (l) => l.title },
          {
            key: "status",
            header: "狀態",
            render: (l) => (
              <StatusBadge
                label={LIVESTREAM_STATUS_LABELS[l.status] ?? l.status}
                variant={livestreamStatusVariant(l.status)}
              />
            ),
          },
          {
            key: "scheduled",
            header: "排程時間",
            render: (l) => (l.scheduled_at ? <span className="text-xs">{formatDate(l.scheduled_at)}</span> : "—"),
          },
          {
            key: "views",
            header: "觀看",
            render: (l) => (l as Livestream & { view_count?: number }).view_count ?? 0,
          },
          {
            key: "actions",
            header: "操作",
            render: (l) => (
              <div className="flex flex-wrap gap-1">
                {l.status === "scheduled" && (
                  <Button size="sm" onClick={() => updateStatus(l.id, "live")}>
                    開始直播
                  </Button>
                )}
                {l.status === "live" && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(l.id, "ended")}>
                    結束
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
