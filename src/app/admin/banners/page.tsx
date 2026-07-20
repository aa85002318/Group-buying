"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import type { CmsBanner } from "@/lib/types/database";

const PLACEMENTS = [
  { value: "home_hero", label: "首頁 Hero" },
  { value: "home_secondary", label: "首頁次要 Banner" },
  { value: "shop", label: "商城" },
  { value: "group_buy", label: "團購" },
  { value: "recipes", label: "食譜" },
  { value: "news", label: "最新資訊" },
  { value: "member", label: "會員中心" },
];

const emptyForm = {
  title: "",
  subtitle: "",
  image_url: "",
  mobile_image_url: "",
  button_text: "了解更多",
  link_url: "",
  placement: "home_hero",
  sort_order: "0",
  status: "active",
  starts_at: "",
  ends_at: "",
};

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/cms?type=banners")
      .then((r) => r.json())
      .then((d) => setBanners(d.banners ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (b: CmsBanner) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      subtitle: b.subtitle ?? "",
      image_url: b.image_url ?? "",
      mobile_image_url: b.mobile_image_url ?? "",
      button_text: b.button_text ?? "了解更多",
      link_url: b.link_url ?? "",
      placement: b.placement ?? "home_hero",
      sort_order: String(b.sort_order ?? 0),
      status: b.status ?? (b.is_active ? "active" : "inactive"),
      starts_at: toLocalInput(b.starts_at),
      ends_at: toLocalInput(b.ends_at),
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      alert("請填寫標題");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        kind: "banner" as const,
        title: form.title,
        subtitle: form.subtitle || null,
        image_url: form.image_url || null,
        mobile_image_url: form.mobile_image_url || null,
        button_text: form.button_text || null,
        link_url: form.link_url || null,
        placement: form.placement,
        sort_order: Number(form.sort_order),
        status: form.status,
        is_active: form.status === "active",
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      };

      const res = await fetch("/api/admin/cms", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (b: CmsBanner) => {
    const nextActive = !b.is_active;
    await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "banner",
        id: b.id,
        is_active: nextActive,
        status: nextActive ? "active" : "inactive",
      }),
    });
    load();
  };

  const move = async (b: CmsBanner, dir: -1 | 1) => {
    await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "banner",
        id: b.id,
        sort_order: b.sort_order + dir * 10,
      }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Banner 管理"
        description="首頁 Hero／商城／團購等版位；連結僅允許內部路徑或合法 https"
        actions={<Button onClick={openCreate}>新增 Banner</Button>}
      />

      {showForm && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
          <p className="text-sm font-medium text-coffee">
            {editingId ? "編輯 Banner" : "新增 Banner"}
          </p>
          <AdminImageUpload
            label="桌機圖"
            images={form.image_url ? [form.image_url] : []}
            onChange={(images) => setForm({ ...form, image_url: images[0] ?? "" })}
            uploadFolder="banners"
            maxImages={1}
            multiple={false}
          />
          <AdminImageUpload
            label="手機圖（選填）"
            images={form.mobile_image_url ? [form.mobile_image_url] : []}
            onChange={(images) => setForm({ ...form, mobile_image_url: images[0] ?? "" })}
            uploadFolder="banners"
            maxImages={1}
            multiple={false}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="標題" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="副標" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            <Input placeholder="按鈕文字" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} />
            <Input placeholder="連結（/shop 或 https://…）" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
            <select className="input-field" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">啟用</option>
              <option value="draft">草稿</option>
              <option value="inactive">停用</option>
            </select>
            <Input type="number" placeholder="排序" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>取消</Button>
          </div>
        </div>
      )}

      <AdminTable
        columns={[
          { key: "title", header: "標題", render: (b) => b.title },
          {
            key: "placement",
            header: "版位",
            render: (b) => PLACEMENTS.find((p) => p.value === b.placement)?.label ?? b.placement ?? "首頁 Hero",
          },
          {
            key: "status",
            header: "狀態",
            render: (b) => (
              <StatusBadge label={b.is_active ? "啟用" : "停用"} variant={b.is_active ? "success" : "secondary"} />
            ),
          },
          { key: "sort", header: "排序", render: (b) => b.sort_order },
          {
            key: "actions",
            header: "操作",
            render: (b) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(b)}>編輯</Button>
                <Button size="sm" variant="outline" onClick={() => move(b, -1)}>上移</Button>
                <Button size="sm" variant="outline" onClick={() => move(b, 1)}>下移</Button>
                <Button size="sm" variant="secondary" onClick={() => toggle(b)}>
                  {b.is_active ? "停用" : "啟用"}
                </Button>
              </div>
            ),
          },
        ]}
        rows={banners}
        loading={loading}
        emptyText="尚無 Banner"
      />
    </div>
  );
}
