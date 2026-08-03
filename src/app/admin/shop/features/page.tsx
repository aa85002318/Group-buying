"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ShopFeature } from "@/lib/shop/features";
import { cn } from "@/lib/utils";

type FormState = {
  title: string;
  image_url: string;
  link_type: "internal" | "external";
  link_url: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  title: "",
  image_url: "",
  link_type: "internal",
  link_url: "/",
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
      title: f.title || "",
      image_url: f.image_url || "",
      link_type: f.link_type === "external" ? "external" : "internal",
      link_url: f.link_url || "/",
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
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.image_url.trim()) {
      alert("請上傳 banner 圖");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim() || "商城特色",
        subtitle: "",
        icon: "star",
        image_url: form.image_url.trim(),
        link_type: form.link_type,
        link_url: form.link_url.trim() || "/",
        background_color: "#F7F8FB",
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
        title="三格商城特色"
        description="固定最多 3 格 banner 圖（前台無區塊標題）。上傳圖片並設定連結即可。"
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
              {editingId ? "編輯特色 Banner" : "新增特色 Banner"}
            </p>
            <AdminImageUpload
              label="Banner 圖（建議約 4:3）"
              images={form.image_url ? [form.image_url] : []}
              onChange={(images) => setForm({ ...form, image_url: images[0] ?? "" })}
              uploadFolder="shop/features"
              maxImages={1}
              multiple={false}
            />
            <Input
              placeholder="備註標題（選填，僅後台辨識／無障礙）"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
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
              placeholder="連結網址"
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            />
            <Input
              placeholder="排序"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              啟用
            </label>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>
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
            <p className="mb-2 text-sm font-medium text-coffee">預覽</p>
            {form.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image_url}
                alt={form.title || "preview"}
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-[#F7F8FB] text-sm text-muted-foreground">
                尚未上傳圖片
              </div>
            )}
          </div>
        </div>
      ) : null}

      <AdminTable
        loading={loading}
        emptyText="尚無特色 Banner"
        columns={[
          {
            key: "preview",
            header: "圖",
            render: (f) =>
              f.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.image_url} alt="" className="h-12 w-16 rounded object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">無圖</span>
              ),
          },
          {
            key: "title",
            header: "標題",
            render: (f) => f.title || "（未命名）",
          },
          {
            key: "link",
            header: "連結",
            render: (f) => f.link_url || "—",
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
                label={f.is_active !== false ? "啟用" : "停用"}
                variant={f.is_active !== false ? "success" : "secondary"}
              />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (f) => (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(f)}>
                  編輯
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggle(f)}>
                  {f.is_active !== false ? "停用" : "啟用"}
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
