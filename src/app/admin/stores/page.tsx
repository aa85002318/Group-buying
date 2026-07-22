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
  cover_image_url: string | null;
  navigation_url: string | null;
  services: unknown;
  daily_highlights: unknown;
  is_active: boolean;
};

const emptyForm = {
  name: "",
  address: "",
  phone: "",
  notes: "",
  business_hours: "",
  cover_image_url: "",
  navigation_url: "",
  services_json: "[]",
  daily_highlights_json: "{}",
  is_active: true,
};

function formatJsonField(value: unknown, fallback: string): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return fallback;
  }
}

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
      cover_image_url: s.cover_image_url ?? "",
      navigation_url: s.navigation_url ?? "",
      services_json: formatJsonField(s.services, "[]"),
      daily_highlights_json: formatJsonField(s.daily_highlights, "{}"),
      is_active: s.is_active,
    });
    setShowForm(true);
  };

  const parseJsonField = (text: string, label: string) => {
    try {
      return JSON.parse(text || (label === "services" ? "[]" : "{}"));
    } catch {
      throw new Error(`${label} 須為合法 JSON`);
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      alert("請填寫名稱與地址");
      return;
    }
    setSaving(true);
    try {
      let services: unknown;
      let daily_highlights: unknown;
      try {
        services = parseJsonField(form.services_json, "services");
        daily_highlights = parseJsonField(form.daily_highlights_json, "daily_highlights");
      } catch (e) {
        alert(e instanceof Error ? e.message : "JSON 格式錯誤");
        return;
      }
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        business_hours: form.business_hours.trim(),
        cover_image_url: form.cover_image_url.trim() || null,
        navigation_url: form.navigation_url.trim() || null,
        services,
        daily_highlights,
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
        title="門市／取貨點管理"
        description="首頁門市資訊與取貨點設定；含封面圖、導航連結、服務項目與每日亮點。"
        actions={<Button onClick={openCreate}>新增門市</Button>}
      />

      {showForm && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
          <h2 className="font-medium text-coffee">{editing ? "編輯門市" : "新增門市"}</h2>
          <Input placeholder="名稱" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="地址" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input placeholder="電話" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input placeholder="營業時間" value={form.business_hours} onChange={(e) => setForm({ ...form, business_hours: e.target.value })} />
          <Input placeholder="封面圖網址" value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} />
          <Input placeholder="導航連結（Google Maps 等）" value={form.navigation_url} onChange={(e) => setForm({ ...form, navigation_url: e.target.value })} />
          <textarea className="input-field min-h-[100px]" placeholder="注意事項" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <textarea className="input-field min-h-[100px] font-mono text-xs" placeholder='服務項目 JSON（例：[{"label":"手作體驗"}]）' value={form.services_json} onChange={(e) => setForm({ ...form, services_json: e.target.value })} />
          <textarea className="input-field min-h-[100px] font-mono text-xs" placeholder='每日亮點 JSON（例：{"today":"限時優惠"}）' value={form.daily_highlights_json} onChange={(e) => setForm({ ...form, daily_highlights_json: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            啟用
          </label>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </div>
      )}

      {selected && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium text-coffee">已選取：{selected.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">地址：{selected.address}</p>
          {selected.navigation_url && (
            <p className="text-sm text-muted-foreground">導航：{selected.navigation_url}</p>
          )}
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
                <Button size="sm" variant="secondary" onClick={() => setSelected(s)}>查看</Button>
                <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>編輯</Button>
                {s.is_active && (
                  <Button size="sm" variant="outline" onClick={() => remove(s)}>停用</Button>
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
