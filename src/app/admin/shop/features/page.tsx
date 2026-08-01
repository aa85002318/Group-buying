"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SHOP_FEATURE_ICON_OPTIONS,
  type ShopFeature,
} from "@/lib/shop/features";
import { cn } from "@/lib/utils";

const BG_PRESETS = ["#E8F3FF", "#FFF5E6", "#FFEFE2", "#EAF4D8", "#EEE9FF", "#F1F2F7"];

type FormState = {
  icon: string;
  title: string;
  subtitle: string;
  link_type: "internal" | "external";
  link_url: string;
  background_color: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  icon: "truck",
  title: "",
  subtitle: "",
  link_type: "internal",
  link_url: "/",
  background_color: "#E8F3FF",
  sort_order: "1",
  is_active: true,
};

export default function AdminShopFeaturesPage() {
  const [features, setFeatures] = useState<ShopFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/shop/features")
      .then((r) => r.json())
      .then((d) => setFeatures(d.features ?? []))
      .catch(() => setFeatures([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (f: ShopFeature) => {
    setEditingId(f.id);
    setForm({
      icon: f.icon || "truck",
      title: f.title,
      subtitle: f.subtitle || "",
      link_type: f.link_type === "external" ? "external" : "internal",
      link_url: f.link_url || "/",
      background_color: f.background_color || "#E8F3FF",
      sort_order: String(f.sort_order ?? 1),
      is_active: f.is_active !== false,
    });
    setShowForm(true);
  };

  const openCreate = () => {
    if (features.length >= 3) {
      alert("商城特色固定最多 3 筆，請編輯現有項目。");
      return;
    }
    setEditingId(null);
    setForm({
      ...emptyForm,
      sort_order: String(features.length + 1),
      background_color: BG_PRESETS[features.length] ?? "#E8F3FF",
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
        icon: form.icon,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        link_type: form.link_type,
        link_url: form.link_url.trim() || "/",
        background_color: form.background_color.trim() || "#E8F3FF",
        sort_order: Number(form.sort_order) || 1,
        is_active: form.is_active,
      };
      const res = await fetch(
        editingId
          ? `/api/admin/shop/features/${editingId}`
          : "/api/admin/shop/features",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
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

  const toggle = async (f: ShopFeature) => {
    await fetch(`/api/admin/shop/features/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !f.is_active }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="商城特色區塊"
        description="固定 3 格：圖示＋標題＋副標＋連結。顯示於熱門商品與新品上架之間。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/shop" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              返回商城 CMS
            </Link>
            <Button size="sm" onClick={openCreate} disabled={features.length >= 3}>
              新增（最多 3）
            </Button>
          </div>
        }
      />

      {showForm ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
            <p className="text-sm font-medium text-coffee">
              {editingId ? "編輯特色" : "新增特色"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="text-muted-foreground">圖示</span>
                <select
                  className="input-field h-10 w-full"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                >
                  {SHOP_FEATURE_ICON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                placeholder="標題"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Input
                placeholder="副標"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">連結類型</span>
                <select
                  className="input-field h-10 w-full"
                  value={form.link_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      link_type: e.target.value as "internal" | "external",
                    })
                  }
                >
                  <option value="internal">站內</option>
                  <option value="external">外部</option>
                </select>
              </label>
              <Input
                placeholder="連結 URL"
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              />
              <Input
                placeholder="排序 1–3"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                啟用
              </label>
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">背景色</p>
              <div className="flex flex-wrap gap-2">
                {BG_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    className={cn(
                      "h-9 w-9 rounded-full border-2",
                      form.background_color.toUpperCase() === c
                        ? "border-[#153E73]"
                        : "border-white shadow-sm"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm({ ...form, background_color: c })}
                  />
                ))}
                <Input
                  value={form.background_color}
                  onChange={(e) =>
                    setForm({ ...form, background_color: e.target.value })
                  }
                  className="max-w-[120px] font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? "儲存中…" : "儲存"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                取消
              </Button>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-3 text-sm font-medium text-coffee">預覽</p>
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: form.background_color || "#E8F3FF" }}
            >
              <p className="text-sm font-bold text-[#153E73]">{form.title || "標題"}</p>
              <p className="mt-1 text-xs text-[#687386]">
                {form.subtitle || "副標"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <AdminTable
        loading={loading}
        emptyText="尚無特色區塊"
        columns={[
          {
            key: "title",
            header: "內容",
            render: (f) => (
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[10px] font-bold text-[#153E73]"
                  style={{ backgroundColor: f.background_color || "#E8F3FF" }}
                >
                  {f.icon}
                </span>
                <div>
                  <p className="font-medium text-coffee">{f.title}</p>
                  <p className="text-[11px] text-muted-foreground">{f.subtitle}</p>
                </div>
              </div>
            ),
          },
          {
            key: "link",
            header: "連結",
            render: (f) => (
              <span className="line-clamp-1 max-w-[200px] text-xs text-muted-foreground">
                {f.link_url}
              </span>
            ),
          },
          {
            key: "sort",
            header: "排序",
            render: (f) => f.sort_order,
          },
          {
            key: "status",
            header: "狀態",
            render: (f) => (
              <StatusBadge
                label={f.is_active ? "啟用" : "停用"}
                variant={f.is_active ? "success" : "secondary"}
              />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (f) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(f)}>
                  編輯
                </Button>
                <Button size="sm" variant="outline" onClick={() => void toggle(f)}>
                  {f.is_active ? "停用" : "啟用"}
                </Button>
              </div>
            ),
          },
        ]}
        rows={features}
      />
    </div>
  );
}
