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

const emptyForm = {
  title: "",
  description: "",
  stream_url: "",
  thumbnail_url: "",
  host_name: "",
  theme_label: "",
  replay_url: "",
  status: "scheduled",
  scheduled_at: "",
  featured_on_home: false,
  sort_order: "0",
};

export default function AdminLivestreamsPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<Livestream>(
    "/api/admin/livestreams",
    "livestreams",
    ["title", "host_name", "theme_label"]
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Livestream | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: String((paginated.length + 1) * 10) });
    setShowForm(true);
  };

  const openEdit = (l: Livestream) => {
    setEditing(l);
    setForm({
      title: l.title,
      description: l.description ?? "",
      stream_url: l.stream_url ?? "",
      thumbnail_url: l.thumbnail_url ?? "",
      host_name: l.host_name ?? "",
      theme_label: l.theme_label ?? "",
      replay_url: l.replay_url ?? "",
      status: l.status,
      scheduled_at: l.scheduled_at ? l.scheduled_at.slice(0, 16) : "",
      featured_on_home: l.featured_on_home ?? false,
      sort_order: String(l.sort_order ?? 0),
    });
    setShowForm(true);
  };

  const save = async () => {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      stream_url: form.stream_url.trim() || null,
      thumbnail_url: form.thumbnail_url.trim() || null,
      host_name: form.host_name.trim() || null,
      theme_label: form.theme_label.trim() || null,
      replay_url: form.replay_url.trim() || null,
      status: form.status,
      scheduled_at: form.scheduled_at || new Date().toISOString(),
      featured_on_home: form.featured_on_home,
      sort_order: Number(form.sort_order) || 0,
    };
    const res = editing
      ? await fetch(`/api/admin/livestreams/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/livestreams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "儲存失敗");
      return;
    }
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

  const toggleFeatured = async (l: Livestream) => {
    await fetch(`/api/admin/livestreams/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured_on_home: !l.featured_on_home }),
    });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="直播管理"
        description="直播排程、首頁精選與狀態控制"
        actions={<Button onClick={openCreate}>新增直播</Button>}
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
          <Input placeholder="直播網址（live URL）" value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} />
          <Input placeholder="回放網址（選填）" value={form.replay_url} onChange={(e) => setForm({ ...form, replay_url: e.target.value })} />
          <Input placeholder="縮圖網址" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
          <Input placeholder="主持人" value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} />
          <Input placeholder="主題標籤" value={form.theme_label} onChange={(e) => setForm({ ...form, theme_label: e.target.value })} />
          <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          <Input type="number" placeholder="排序" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured_on_home} onChange={(e) => setForm({ ...form, featured_on_home: e.target.checked })} />
            首頁精選
          </label>
          <div className="flex gap-2">
            <Button onClick={save}>儲存</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </div>
      )}

      <AdminTable
        columns={[
          { key: "title", header: "標題", render: (l) => l.title },
          { key: "host", header: "主持人", render: (l) => l.host_name ?? "—" },
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
            key: "featured",
            header: "首頁",
            render: (l) => (
              <Button size="sm" variant={l.featured_on_home ? "default" : "outline"} onClick={() => toggleFeatured(l)}>
                {l.featured_on_home ? "已精選" : "設精選"}
              </Button>
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
            render: (l) => l.view_count ?? 0,
          },
          {
            key: "actions",
            header: "操作",
            render: (l) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => openEdit(l)}>編輯</Button>
                {l.status === "scheduled" && (
                  <Button size="sm" onClick={() => updateStatus(l.id, "live")}>開始直播</Button>
                )}
                {l.status === "live" && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(l.id, "ended")}>結束</Button>
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
