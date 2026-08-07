"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ShopCmsLiveSaveNotice } from "@/components/admin/shop/ShopCmsLiveSaveNotice";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CatRow = {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  sort_order?: number | null;
  inspiration_sort_order?: number | null;
  show_on_inspiration_wall?: boolean;
  is_active?: boolean;
};

type FormState = {
  name: string;
  slug: string;
  image_url: string;
  sort_order: string;
  inspiration_sort_order: string;
  show_on_inspiration_wall: boolean;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  image_url: "",
  sort_order: "100",
  inspiration_sort_order: "100",
  show_on_inspiration_wall: true,
  is_active: true,
};

export default function AdminShopRecipeCategoriesPage() {
  const [categories, setCategories] = useState<CatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/shop/recipe-categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => setCategories([]))
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

  const openEdit = (c: CatRow) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      image_url: c.image_url || "",
      sort_order: String(c.sort_order ?? 100),
      inspiration_sort_order: String(c.inspiration_sort_order ?? 100),
      show_on_inspiration_wall: c.show_on_inspiration_wall !== false,
      is_active: c.is_active !== false,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      alert("請填寫名稱");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        image_url: form.image_url.trim() || null,
        sort_order: Number(form.sort_order) || 100,
        inspiration_sort_order: Number(form.inspiration_sort_order) || 100,
        show_on_inspiration_wall: form.show_on_inspiration_wall,
        is_active: form.is_active,
      };
      const res = await fetch(
        editingId
          ? `/api/admin/shop/recipe-categories/${editingId}`
          : "/api/admin/shop/recipe-categories",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: CatRow) => {
    if (!confirm(`確定刪除分類「${c.name}」？`)) return;
    const res = await fetch(`/api/admin/shop/recipe-categories/${c.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "刪除失敗");
      return;
    }
    load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="食譜分類"
        description="靈感牆分類選單：可新增／刪除，並更換上方圓形圖案。系統固定保留「熱門推薦／全部」。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/shop?section=recipe-categories" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              返回商城 CMS
            </Link>
            <Button size="sm" onClick={openCreate}>
              新增分類
            </Button>
          </div>
        }
      />

      <ShopCmsLiveSaveNotice section="recipe-categories" />

      {showForm ? (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
          <p className="text-sm font-medium text-coffee">
            {editingId ? "編輯分類" : "新增分類"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="名稱"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <Input
              placeholder="一般排序"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
            <Input
              placeholder="靈感牆排序"
              value={form.inspiration_sort_order}
              onChange={(e) =>
                setForm({ ...form, inspiration_sort_order: e.target.value })
              }
            />
          </div>
          <AdminImageUpload
            label="上方圖案（圓形選單）"
            images={form.image_url ? [form.image_url] : []}
            onChange={(images) => setForm({ ...form, image_url: images[0] ?? "" })}
            uploadFolder="shop/recipe-categories"
            maxImages={1}
            multiple={false}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.show_on_inspiration_wall}
              onChange={(e) =>
                setForm({ ...form, show_on_inspiration_wall: e.target.checked })
              }
            />
            顯示於靈感牆
          </label>
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
      ) : null}

      <AdminTable
        loading={loading}
        emptyText="尚無分類"
        columns={[
          {
            key: "img",
            header: "圖",
            render: (c) =>
              c.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                "—"
              ),
          },
          { key: "name", header: "名稱", render: (c) => c.name },
          { key: "slug", header: "Slug", render: (c) => c.slug },
          {
            key: "wall",
            header: "靈感牆",
            render: (c) => (c.show_on_inspiration_wall !== false ? "是" : "否"),
          },
          {
            key: "sort",
            header: "牆排序",
            render: (c) => c.inspiration_sort_order ?? 100,
          },
          {
            key: "status",
            header: "狀態",
            render: (c) => (
              <StatusBadge
                label={c.is_active !== false ? "啟用" : "停用"}
                variant={c.is_active !== false ? "success" : "secondary"}
              />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (c) => (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                  編輯
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(c)}>
                  刪除
                </Button>
              </div>
            ),
          },
        ]}
        rows={categories}
      />
    </div>
  );
}
