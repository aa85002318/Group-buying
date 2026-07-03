"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import type { Video } from "@/lib/types/database";

export default function AdminVideosPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<Video>(
    "/api/admin/videos",
    "videos",
    ["title"]
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", video_url: "", description: "", is_active: true });

  const save = async () => {
    await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    refresh();
  };

  const toggleActive = async (v: Video) => {
    await fetch(`/api/admin/videos/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !v.is_active }),
    });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="影音管理"
        description="教學與行銷影片管理"
        actions={<Button onClick={() => setShowForm(true)}>新增影片</Button>}
      />

      {showForm && (
        <div className="rounded-xl bg-white p-4 shadow-card space-y-3">
          <Input placeholder="標題" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="影片網址" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
          <textarea
            className="input-field min-h-[80px]"
            placeholder="說明"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
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
          { key: "title", header: "標題", render: (v) => v.title },
          { key: "views", header: "觀看", render: (v) => v.view_count },
          {
            key: "status",
            header: "狀態",
            render: (v) => (
              <StatusBadge label={v.is_active ? "上架" : "下架"} variant={v.is_active ? "success" : "secondary"} />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (v) => (
              <Button size="sm" variant="secondary" onClick={() => toggleActive(v)}>
                {v.is_active ? "下架" : "上架"}
              </Button>
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
