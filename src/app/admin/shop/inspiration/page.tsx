"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ShopInspirationPost } from "@/lib/shop/inspiration";
import { cn } from "@/lib/utils";

type FormState = {
  category: string;
  card_type: string;
  title: string;
  image_url: string;
  aspect: string;
  author_name: string;
  materials: string;
  href: string;
  sort_order: string;
  is_featured: boolean;
  is_active: boolean;
  tip_body: string;
  cook_time: string;
  difficulty: string;
  product_name: string;
  product_href: string;
};

const emptyForm: FormState = {
  category: "community",
  card_type: "community",
  title: "",
  image_url: "",
  aspect: "4/5",
  author_name: "",
  materials: "",
  href: "/recipes",
  sort_order: "100",
  is_featured: false,
  is_active: true,
  tip_body: "",
  cook_time: "",
  difficulty: "",
  product_name: "",
  product_href: "",
};

export default function AdminShopInspirationPage() {
  const [posts, setPosts] = useState<ShopInspirationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/shop/inspiration")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (p: ShopInspirationPost) => {
    setEditingId(p.id);
    setForm({
      category: p.category,
      card_type: p.card_type,
      title: p.title,
      image_url: p.image_url,
      aspect: p.aspect,
      author_name: p.author_name,
      materials: p.materials.join("、"),
      href: p.href,
      sort_order: String(p.sort_order),
      is_featured: p.is_featured,
      is_active: p.is_active,
      tip_body: p.tip_body ?? "",
      cook_time: p.cook_time ?? "",
      difficulty: p.difficulty ?? "",
      product_name: p.product_name ?? "",
      product_href: p.product_href ?? "",
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: String(posts.length + 1) });
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
        ...form,
        title: form.title.trim(),
        author_name: form.author_name.trim() || "CHIMEIDIY",
        materials: form.materials,
        sort_order: Number(form.sort_order) || 100,
      };
      const res = await fetch(
        editingId
          ? `/api/admin/shop/inspiration/${editingId}`
          : "/api/admin/shop/inspiration",
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

  const toggleActive = async (p: ShopInspirationPost) => {
    await fetch(`/api/admin/shop/inspiration/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="烘焙靈感牆"
        description="管理商城靈感卡片：圖片、作者、分類、心得與精選排序。"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/shop" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              返回商城 CMS
            </Link>
            <Button size="sm" onClick={openCreate}>
              新增卡片
            </Button>
          </div>
        }
      />

      {showForm ? (
        <div className="space-y-3 rounded-xl border border-border bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              標題
              <Input className="mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="text-sm">
              作者
              <Input className="mt-1" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
            </label>
            <label className="text-sm">
              分類
              <select
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value, card_type: e.target.value })}
              >
                <option value="community">大家作品</option>
                <option value="recipe">食譜靈感</option>
                <option value="teacher">老師作品</option>
                <option value="tip">烘焙心得</option>
              </select>
            </label>
            <label className="text-sm">
              圖片比例
              <select
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.aspect}
                onChange={(e) => setForm({ ...form, aspect: e.target.value })}
              >
                <option value="1/1">1:1</option>
                <option value="4/5">4:5</option>
                <option value="3/4">3:4</option>
              </select>
            </label>
            <label className="text-sm md:col-span-2">
              圖片 URL
              <Input className="mt-1" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </label>
            <label className="text-sm md:col-span-2">
              使用材料（逗號分隔）
              <Input className="mt-1" value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} />
            </label>
            <label className="text-sm">
              連結
              <Input className="mt-1" value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} />
            </label>
            <label className="text-sm">
              排序
              <Input className="mt-1" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </label>
            <label className="text-sm md:col-span-2">
              心得內容
              <Input className="mt-1" value={form.tip_body} onChange={(e) => setForm({ ...form, tip_body: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
              精選
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              上架
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </div>
      ) : null}

      <AdminTable
        loading={loading}
        rows={posts}
        columns={[
          { key: "title", header: "標題", render: (p) => p.title },
          { key: "category", header: "分類", render: (p) => p.category },
          { key: "author", header: "作者", render: (p) => p.author_name },
          {
            key: "status",
            header: "狀態",
            render: (p) => (
              <StatusBadge
                label={p.is_active ? "上架" : "下架"}
                variant={p.is_active ? "success" : "secondary"}
              />
            ),
          },
          { key: "sort", header: "排序", render: (p) => p.sort_order },
          {
            key: "actions",
            header: "操作",
            render: (p) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>編輯</Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(p)}>
                  {p.is_active ? "下架" : "上架"}
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
