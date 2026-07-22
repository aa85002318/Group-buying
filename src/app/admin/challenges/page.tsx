"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";

type ChallengeRow = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  status: "draft" | "published" | "archived";
  featured_on_home: boolean;
  sort_order: number;
  participant_count: number;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  published: "已發布",
  archived: "已封存",
};

const emptyForm = {
  title: "",
  slug: "",
  cover_image_url: "",
  description: "",
  rules: "",
  status: "draft" as ChallengeRow["status"],
  featured_on_home: false,
  sort_order: "0",
  starts_at: "",
  ends_at: "",
};

export default function AdminChallengesPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } =
    useAdminList<ChallengeRow>("/api/admin/challenges", "challenges", ["title", "slug"]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ChallengeRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: String((paginated.length + 1) * 10) });
    setShowForm(true);
  };

  const openEdit = (row: ChallengeRow) => {
    setEditing(row);
    setForm({
      title: row.title,
      slug: row.slug,
      cover_image_url: row.cover_image_url ?? "",
      description: "",
      rules: "",
      status: row.status,
      featured_on_home: row.featured_on_home,
      sort_order: String(row.sort_order),
      starts_at: "",
      ends_at: "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      alert("請填寫標題與 slug");
      return;
    }
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      cover_image_url: form.cover_image_url.trim() || null,
      description: form.description.trim() || null,
      rules: form.rules.trim() || null,
      status: form.status,
      featured_on_home: form.featured_on_home,
      sort_order: Number(form.sort_order) || 0,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };
    const res = editing
      ? await fetch(`/api/admin/challenges/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/challenges", {
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

  const toggleFeatured = async (row: ChallengeRow) => {
    await fetch(`/api/admin/challenges/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured_on_home: !row.featured_on_home }),
    });
    refresh();
  };

  const remove = async (row: ChallengeRow) => {
    if (!confirm(`確定刪除「${row.title}」？`)) return;
    await fetch(`/api/admin/challenges/${row.id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="烘焙挑戰管理"
        description="首頁「本月烘焙挑戰」區塊內容"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreate}>新增挑戰</Button>
            <Link
              href="/admin/home"
              className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-caramel"
            >
              返回首頁管理
            </Link>
          </div>
        }
      />

      {showForm && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
          <Input placeholder="標題 *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="slug *" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input placeholder="封面圖網址" value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} />
          <textarea className="input-field min-h-[80px]" placeholder="說明" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <textarea className="input-field min-h-[80px]" placeholder="規則" value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
          <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ChallengeRow["status"] })}>
            <option value="draft">草稿</option>
            <option value="published">已發布</option>
            <option value="archived">已封存</option>
          </select>
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
          { key: "title", header: "標題", render: (r) => r.title },
          { key: "slug", header: "slug", render: (r) => r.slug },
          {
            key: "status",
            header: "狀態",
            render: (r) => (
              <StatusBadge
                label={STATUS_LABELS[r.status] ?? r.status}
                variant={r.status === "published" ? "success" : "secondary"}
              />
            ),
          },
          {
            key: "featured",
            header: "首頁",
            render: (r) => (
              <Button size="sm" variant={r.featured_on_home ? "default" : "outline"} onClick={() => toggleFeatured(r)}>
                {r.featured_on_home ? "已精選" : "設精選"}
              </Button>
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (r) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>編輯</Button>
                <Button size="sm" variant="outline" onClick={() => remove(r)}>刪除</Button>
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
