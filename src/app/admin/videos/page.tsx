"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import { parseVideoEmbedUrl, slugifyTitle } from "@/lib/videos/embed";
import type { Video } from "@/lib/types/database";

export default function AdminVideosPage() {
  const router = useRouter();
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<Video>(
    "/api/admin/videos",
    "videos",
    ["title", "slug", "category"]
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    video_url: "",
    summary: "",
    description: "",
    thumbnail_url: "",
    category: "一分鐘教你做",
    duration_seconds: "",
    status: "published",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const parsed = parseVideoEmbedUrl(form.video_url);
    if (parsed.kind === "invalid") {
      alert(parsed.error ?? "影片網址無效");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: form.slug.trim() || slugifyTitle(form.title),
          duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
          video_type: parsed.kind,
          published_at: form.status === "published" ? new Date().toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setShowForm(false);
      refresh();
      if (data.video?.id) router.push(`/admin/videos/${data.video.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (v: Video) => {
    await fetch(`/api/admin/videos/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_active: !v.is_active,
        status: v.is_active ? "archived" : "published",
      }),
    });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="影音管理"
        description="YouTube／外部連結影音；不接受任意 iframe HTML"
        actions={<Button onClick={() => setShowForm(true)}>新增影音</Button>}
      />

      {showForm && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
          <Input placeholder="標題" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Slug（可空）" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input placeholder="影片網址（YouTube 或 https）" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
          <Input placeholder="縮圖網址" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
          <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option>一分鐘教你做</option>
            <option>完整教學</option>
            <option>直播回放</option>
            <option>烘焙技巧</option>
            <option>老師專欄</option>
          </select>
          <Input type="number" placeholder="長度（秒）" value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: e.target.value })} />
          <textarea className="input-field min-h-[80px]" placeholder="摘要" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">草稿</option>
            <option value="published">發布</option>
            <option value="archived">下架</option>
          </select>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </div>
      )}

      <AdminTable
        columns={[
          { key: "title", header: "標題", render: (v) => v.title },
          { key: "category", header: "分類", render: (v) => v.category ?? "—" },
          { key: "views", header: "觀看", render: (v) => v.view_count },
          {
            key: "status",
            header: "狀態",
            render: (v) => (
              <StatusBadge
                label={v.is_active && (v.status === "published" || !v.status) ? "上架" : "下架"}
                variant={v.is_active ? "success" : "secondary"}
              />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (v) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => router.push(`/admin/videos/${v.id}`)}>
                  編輯
                </Button>
                <Link href={`/videos/${v.slug || v.id}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">預覽</Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={() => toggleActive(v)}>
                  {v.is_active ? "下架" : "上架"}
                </Button>
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
        emptyText="尚無影音"
      />
    </div>
  );
}
