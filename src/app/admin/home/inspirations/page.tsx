"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";

type InspirationRow = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_type: string | null;
  target_url: string | null;
  button_label: string | null;
  sort_order: number;
  is_active: boolean;
};

const emptyForm = {
  title: "",
  subtitle: "",
  image_url: "",
  link_type: "recipe",
  target_url: "/recipes",
  button_label: "去看看",
  sort_order: "0",
  is_active: true,
};

export default function AdminHomeInspirationsPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } =
    useAdminList<InspirationRow>("/api/admin/home/inspirations", "inspirations", ["title"]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InspirationRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: String((paginated.length + 1) * 10) });
    setShowForm(true);
  };

  const openEdit = (row: InspirationRow) => {
    setEditing(row);
    setForm({
      title: row.title,
      subtitle: row.subtitle ?? "",
      image_url: row.image_url ?? "",
      link_type: row.link_type ?? "recipe",
      target_url: row.target_url ?? "",
      button_label: row.button_label ?? "去看看",
      sort_order: String(row.sort_order),
      is_active: row.is_active,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      alert("請填寫標題");
      return;
    }
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      image_url: form.image_url.trim() || null,
      link_type: form.link_type.trim() || null,
      target_url: form.target_url.trim() || null,
      button_label: form.button_label.trim() || "去看看",
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    const res = editing
      ? await fetch(`/api/admin/home/inspirations/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/home/inspirations", {
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

  const toggle = async (row: InspirationRow) => {
    await fetch(`/api/admin/home/inspirations/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !row.is_active }),
    });
    refresh();
  };

  const remove = async (row: InspirationRow) => {
    if (!confirm(`確定刪除「${row.title}」？`)) return;
    await fetch(`/api/admin/home/inspirations/${row.id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="烘焙靈感管理"
        description="首頁「今日烘焙靈感」區塊的卡片內容"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreate}>新增靈感</Button>
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
          <Input placeholder="副標" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <Input placeholder="圖片網址" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <Input placeholder="連結類型" value={form.link_type} onChange={(e) => setForm({ ...form, link_type: e.target.value })} />
          <Input placeholder="目標連結" value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} />
          <Input placeholder="按鈕文字" value={form.button_label} onChange={(e) => setForm({ ...form, button_label: e.target.value })} />
          <Input type="number" placeholder="排序" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            啟用
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
          { key: "subtitle", header: "副標", render: (r) => r.subtitle ?? "—" },
          { key: "sort", header: "排序", render: (r) => r.sort_order },
          {
            key: "status",
            header: "狀態",
            render: (r) => (
              <StatusBadge label={r.is_active ? "啟用" : "停用"} variant={r.is_active ? "success" : "secondary"} />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (r) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>編輯</Button>
                <Button size="sm" variant="secondary" onClick={() => toggle(r)}>
                  {r.is_active ? "停用" : "啟用"}
                </Button>
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
