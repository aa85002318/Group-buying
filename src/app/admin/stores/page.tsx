"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";

type StoreRow = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  notes: string | null;
  business_hours: string | null;
  is_active: boolean;
};

const emptyForm = {
  name: "",
  address: "",
  phone: "",
  notes: "",
  business_hours: "",
  is_active: true,
};

export default function AdminStoresPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } =
    useAdminList<StoreRow>("/api/admin/stores", "stores", ["name", "address", "phone"]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StoreRow | null>(null);
  const [selected, setSelected] = useState<StoreRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s: StoreRow) => {
    setEditing(s);
    setForm({
      name: s.name,
      address: s.address,
      phone: s.phone ?? "",
      notes: s.notes ?? "",
      business_hours: s.business_hours ?? "",
      is_active: s.is_active,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      alert("請填寫名稱與地址");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        business_hours: form.business_hours.trim(),
        is_active: form.is_active,
      };
      const res = editing
        ? await fetch(`/api/admin/stores/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/stores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setShowForm(false);
      setSelected(data.store ?? null);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: StoreRow) => {
    if (!confirm(`確定停用取貨點「${s.name}」？\n（不會刪除歷史訂單關聯，僅改為停用）`)) return;
    const res = await fetch(`/api/admin/stores/${s.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "刪除失敗");
      return;
    }
    if (selected?.id === s.id) setSelected(null);
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="取貨點管理"
        description="新增／編輯取貨門市；點選列可查看地址與注意事項"
        actions={<Button onClick={openCreate}>新增取貨點</Button>}
      />

      {showForm && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
          <h2 className="font-medium text-coffee">{editing ? "編輯取貨點" : "新增取貨點"}</h2>
          <Input
            placeholder="名稱（例：忠孝門市）"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="地址"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            placeholder="電話（選填）"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            placeholder="營業時間（選填）"
            value={form.business_hours}
            onChange={(e) => setForm({ ...form, business_hours: e.target.value })}
          />
          <textarea
            className="input-field min-h-[100px]"
            placeholder="注意事項（顧客選取此取貨點後會顯示）"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            啟用（前台可選擇）
          </label>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              取消
            </Button>
          </div>
        </div>
      )}

      {selected && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium text-coffee">已選取：{selected.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">地址：{selected.address}</p>
          {selected.phone && <p className="text-sm text-muted-foreground">電話：{selected.phone}</p>}
          {selected.business_hours && (
            <p className="text-sm text-muted-foreground">營業時間：{selected.business_hours}</p>
          )}
          <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
            <p className="font-medium">注意事項</p>
            <p className="mt-1 whitespace-pre-wrap">{selected.notes?.trim() || "尚無注意事項"}</p>
          </div>
        </div>
      )}

      <AdminTable
        columns={[
          {
            key: "name",
            header: "名稱",
            render: (s) => (
              <button type="button" className="text-left font-medium text-primary hover:underline" onClick={() => setSelected(s)}>
                {s.name}
              </button>
            ),
          },
          { key: "address", header: "地址", render: (s) => <span className="text-xs">{s.address}</span> },
          {
            key: "status",
            header: "狀態",
            render: (s) => (
              <StatusBadge label={s.is_active ? "啟用" : "停用"} variant={s.is_active ? "success" : "secondary"} />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (s) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => setSelected(s)}>
                  查看
                </Button>
                <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>
                  編輯
                </Button>
                {s.is_active && (
                  <Button size="sm" variant="outline" onClick={() => remove(s)}>
                    停用
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋名稱、地址…"
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
