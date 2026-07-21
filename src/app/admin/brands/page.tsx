"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Brand = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  country: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
};

const emptyForm = { name: "", slug: "", logo_url: "", country: "", sort_order: 0, is_active: true };

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((d) => setBrands(d.brands ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    setCreating(false);
    setForm({
      name: brand.name,
      slug: brand.slug ?? "",
      logo_url: brand.logo_url ?? "",
      country: brand.country ?? "",
      sort_order: brand.sort_order ?? 0,
      is_active: brand.is_active,
    });
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (creating) {
        await fetch("/api/admin/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else if (editing) {
        await fetch(`/api/admin/brands/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      closeForm();
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (brand: Brand) => {
    if (!confirm(`確定停用品牌「${brand.name}」？`)) return;
    await fetch(`/api/admin/brands/${brand.id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="品牌管理"
        description="管理商品品牌，可在商品編輯時選用"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            新增品牌
          </Button>
        }
      />

      {(creating || editing) && (
        <div className="rounded-[20px] border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="font-semibold text-foreground">{creating ? "新增品牌" : `編輯：${editing?.name}`}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="品牌名稱 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="網址代碼（slug）" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <Input placeholder="Logo 圖片網址" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="sm:col-span-2" />
            <Input placeholder="國家/地區（選填）" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <Input
              type="number"
              placeholder="排序（數字越小越前）"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            啟用中
          </label>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
            <Button variant="outline" onClick={closeForm}>
              取消
            </Button>
          </div>
        </div>
      )}

      <AdminTable
        loading={loading}
        emptyText="尚無品牌"
        columns={[
          {
            key: "logo",
            header: "Logo",
            render: (b) =>
              b.logo_url ? (
                <Image src={b.logo_url} alt={b.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-sm text-foreground-secondary">—</div>
              ),
          },
          { key: "name", header: "品牌名稱", render: (b) => <span className="font-medium text-foreground">{b.name}</span> },
          { key: "slug", header: "Slug", render: (b) => b.slug ?? "—" },
          { key: "country", header: "國家", render: (b) => b.country ?? "—" },
          { key: "sort_order", header: "排序", render: (b) => b.sort_order ?? 0 },
          { key: "product_count", header: "商品數", render: (b) => b.product_count },
          {
            key: "status",
            header: "狀態",
            render: (b) => <StatusBadge label={b.is_active ? "啟用" : "停用"} variant={b.is_active ? "success" : "default"} />,
          },
          {
            key: "actions",
            header: "",
            render: (b) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(b)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ),
          },
        ]}
        rows={brands}
      />
    </div>
  );
}
