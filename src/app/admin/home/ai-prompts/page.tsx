"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";

type PromptRow = {
  id: string;
  label: string;
  prompt: string;
  sort_order: number;
  is_active: boolean;
};

const emptyForm = {
  label: "",
  prompt: "",
  sort_order: "0",
  is_active: true,
};

export default function AdminHomeAiPromptsPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } =
    useAdminList<PromptRow>("/api/admin/home/ai-prompts", "prompts", ["label", "prompt"]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromptRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: String((paginated.length + 1) * 10) });
    setShowForm(true);
  };

  const openEdit = (row: PromptRow) => {
    setEditing(row);
    setForm({
      label: row.label,
      prompt: row.prompt,
      sort_order: String(row.sort_order),
      is_active: row.is_active,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.label.trim() || !form.prompt.trim()) {
      alert("請填寫標籤與提問內容");
      return;
    }
    const payload = {
      label: form.label.trim(),
      prompt: form.prompt.trim(),
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    const res = editing
      ? await fetch(`/api/admin/home/ai-prompts/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/home/ai-prompts", {
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

  const toggle = async (row: PromptRow) => {
    await fetch(`/api/admin/home/ai-prompts/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !row.is_active }),
    });
    refresh();
  };

  const remove = async (row: PromptRow) => {
    if (!confirm(`確定刪除「${row.label}」？`)) return;
    await fetch(`/api/admin/home/ai-prompts/${row.id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="AI 提問管理"
        description="首頁 AI 烘焙助手區塊的快捷提問；區塊標題與輸入框設定在首頁管理。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreate}>新增提問</Button>
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
          <Input placeholder="顯示標籤 *" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <textarea
            className="input-field min-h-[80px]"
            placeholder="提問內容 *"
            value={form.prompt}
            onChange={(e) => setForm({ ...form, prompt: e.target.value })}
          />
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
          { key: "label", header: "標籤", render: (r) => r.label },
          { key: "prompt", header: "提問", render: (r) => <span className="text-xs">{r.prompt}</span> },
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
