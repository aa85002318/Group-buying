"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type RecipeRow = {
  id: string;
  title: string;
  slug: string;
  cover_image?: string | null;
  status?: string | null;
  show_in_inspiration_wall?: boolean;
  is_featured_inspiration?: boolean;
  inspiration_sort_order?: number | null;
  inspiration_category?: string | null;
  inspiration_banner_url?: string | null;
};

export default function AdminShopInspirationPage() {
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RecipeRow | null>(null);
  const [bannerUrl, setBannerUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [category, setCategory] = useState("");
  const [onWall, setOnWall] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/shop/inspiration")
      .then((r) => r.json())
      .then((d) => setRecipes(d.recipes ?? []))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (r: RecipeRow) => {
    setEditing(r);
    setBannerUrl(r.inspiration_banner_url || "");
    setSortOrder(String(r.inspiration_sort_order ?? 0));
    setCategory(r.inspiration_category || "");
    setOnWall(r.show_in_inspiration_wall !== false);
    setFeatured(Boolean(r.is_featured_inspiration));
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/shop/inspiration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          inspiration_banner_url: bannerUrl.trim() || null,
          inspiration_sort_order: Number(sortOrder) || 0,
          inspiration_category: category.trim() || null,
          show_in_inspiration_wall: onWall,
          is_featured_inspiration: featured,
          inspiration_use_ip_image: false,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setEditing(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return recipes;
    return recipes.filter((r) => r.title.toLowerCase().includes(needle));
  }, [recipes, q]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="烘焙靈感牆"
        description="管理牆上食譜露出、精選與滿版 banner。新增食譜請至食譜主檔；此處調整牆面欄位。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/shop" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              返回商城 CMS
            </Link>
            <Link
              href="/admin/shop/recipe-categories"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              食譜分類
            </Link>
            <Link href="/admin/recipes" className={cn(buttonVariants({ size: "sm" }))}>
              食譜主檔
            </Link>
          </div>
        }
      />

      {editing ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
            <p className="text-sm font-medium text-coffee">編輯：{editing.title}</p>
            <AdminImageUpload
              label="精選滿版 Banner（建議 5:2）"
              images={bannerUrl ? [bannerUrl] : []}
              onChange={(images) => setBannerUrl(images[0] ?? "")}
              uploadFolder="shop/inspiration"
              maxImages={1}
              multiple={false}
            />
            <Input
              placeholder="靈感分類 slug（如 cake）"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Input
              placeholder="牆上排序（數字越小越前）"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onWall} onChange={(e) => setOnWall(e.target.checked)} />
              顯示於靈感牆
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              設為精選（AI 今日推薦）
            </label>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>
                {saving ? "儲存中…" : "儲存"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                取消
              </Button>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-2 text-sm font-medium text-coffee">Banner 預覽</p>
            {bannerUrl || editing.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerUrl || editing.cover_image || ""}
                alt=""
                className="aspect-[5/2] w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="flex aspect-[5/2] items-center justify-center rounded-2xl bg-[#FFF7E3] text-sm text-muted-foreground">
                尚未設定 banner（將使用封面）
              </div>
            )}
          </div>
        </div>
      ) : null}

      <Input
        placeholder="搜尋食譜標題…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />

      <AdminTable
        loading={loading}
        emptyText="尚無食譜"
        columns={[
          {
            key: "cover",
            header: "圖",
            render: (r) =>
              r.inspiration_banner_url || r.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.inspiration_banner_url || r.cover_image || ""}
                  alt=""
                  className="h-10 w-16 rounded object-cover"
                />
              ) : (
                "—"
              ),
          },
          { key: "title", header: "食譜", render: (r) => r.title },
          {
            key: "wall",
            header: "牆上",
            render: (r) => (r.show_in_inspiration_wall ? "是" : "否"),
          },
          {
            key: "feat",
            header: "精選",
            render: (r) => (r.is_featured_inspiration ? "是" : "—"),
          },
          {
            key: "sort",
            header: "排序",
            render: (r) => r.inspiration_sort_order ?? 0,
          },
          {
            key: "status",
            header: "狀態",
            render: (r) => (
              <StatusBadge
                label={r.status === "published" ? "已發布" : String(r.status || "草稿")}
                variant={r.status === "published" ? "success" : "secondary"}
              />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (r) => (
              <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                編輯牆面
              </Button>
            ),
          },
        ]}
        rows={filtered}
      />
    </div>
  );
}
