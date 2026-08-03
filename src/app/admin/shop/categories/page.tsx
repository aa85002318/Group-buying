"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_COLOR_PRESETS,
  isReservedCategoryName,
  normalizeCategoryHex,
} from "@/lib/shop/categories";
import { cn } from "@/lib/utils";

type ShopCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  shop_home_icon?: string | null;
  shop_home_bg_color?: string | null;
  shop_home_sort_order?: number | null;
  sort_order?: number | null;
  is_active?: boolean;
  is_main_category?: boolean;
  show_on_shop_home?: boolean;
  custom_link?: string | null;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  background_color: string;
  custom_link: string;
  sort_order: string;
  is_active: boolean;
  is_main_category: boolean;
  show_on_shop_home: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  background_color: "#FFF4CC",
  custom_link: "",
  sort_order: "10",
  is_active: true,
  is_main_category: true,
  show_on_shop_home: true,
};

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const selected = normalizeCategoryHex(value) ?? value.toUpperCase();

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-coffee">圓形背景色</p>
      <div className="flex flex-wrap gap-3">
        {CATEGORY_COLOR_PRESETS.map((color) => {
          const active = selected === color.value;
          return (
            <button
              key={color.value}
              type="button"
              aria-label={color.name}
              title={color.name}
              style={{ backgroundColor: color.value }}
              onClick={() => onChange(color.value)}
              className={cn(
                "relative h-10 w-10 rounded-full border-2",
                active
                  ? "border-[#153E73] ring-2 ring-[#153E73]/20"
                  : "border-white shadow-sm"
              )}
            >
              {active ? (
                <Check className="absolute inset-0 m-auto h-4 w-4 text-[#153E73]" />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={normalizeCategoryHex(value) ?? "#FFF4CC"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          aria-label="自訂顏色"
          className="h-10 w-14 cursor-pointer rounded border border-border bg-white"
        />
        <Input
          value={value}
          placeholder="#FFF4CC"
          onChange={(e) => onChange(e.target.value)}
          className="max-w-[140px] font-mono uppercase"
        />
      </div>
    </div>
  );
}

export default function AdminShopCategoriesPage() {
  const [categories, setCategories] = useState<ShopCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterHome, setFilterHome] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/shop/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const visible = filterHome
    ? categories.filter((c) => c.show_on_shop_home || c.is_main_category)
    : categories;

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sort_order: String(
        Math.max(0, ...categories.map((c) => c.shop_home_sort_order ?? 0)) + 10
      ),
    });
    setShowForm(true);
  };

  const openEdit = (c: ShopCategoryRow) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      image_url: c.shop_home_icon || c.icon_url || "",
      background_color: c.shop_home_bg_color || "#FFF4CC",
      custom_link: c.custom_link ?? "",
      sort_order: String(c.shop_home_sort_order ?? c.sort_order ?? 10),
      is_active: c.is_active !== false,
      is_main_category: c.is_main_category !== false,
      show_on_shop_home: c.show_on_shop_home !== false,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      alert("請填寫分類名稱");
      return;
    }
    if (isReservedCategoryName(form.name)) {
      alert("全部分類為系統固定項目，無須另外新增。");
      return;
    }
    const bg = normalizeCategoryHex(form.background_color);
    if (!bg) {
      alert("背景顏色須為 #RRGGBB");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        image_url: form.image_url || null,
        background_color: bg,
        custom_link: form.custom_link.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        is_main_category: form.is_main_category,
        show_on_shop_home: form.show_on_shop_home,
      };
      const res = await fetch(
        editingId
          ? `/api/admin/shop/categories/${editingId}`
          : "/api/admin/shop/categories",
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

  const toggleActive = async (c: ShopCategoryRow) => {
    await fetch(`/api/admin/shop/categories/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    load();
  };

  const move = async (c: ShopCategoryRow, dir: -1 | 1) => {
    await fetch(`/api/admin/shop/categories/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop_home_sort_order: (c.shop_home_sort_order ?? 0) + dir * 10,
      }),
    });
    load();
  };

  const remove = async (c: ShopCategoryRow) => {
    if (!confirm(`確定刪除「${c.name}」？`)) return;
    const res = await fetch(`/api/admin/shop/categories/${c.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409) {
      const goDeactivate = confirm(
        `${(data as { error?: string }).error ?? "此分類仍有關聯。"}\n\n按「確定」改為停用分類，或取消後前往查看商品。`
      );
      if (goDeactivate) {
        const dRes = await fetch(
          `/api/admin/shop/categories/${c.id}?deactivate=1`,
          { method: "DELETE" }
        );
        const dData = await dRes.json().catch(() => ({}));
        if (!dRes.ok) {
          alert((dData as { error?: string }).error ?? "停用失敗");
          return;
        }
        load();
        return;
      }
      if (confirm("要前往商品列表查看此分類商品嗎？")) {
        window.location.href = `/admin/products?category=${c.id}`;
      }
      return;
    }
    if (!res.ok) {
      alert((data as { error?: string }).error ?? "刪除失敗");
      return;
    }
    load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="商城主分類"
        description="控制 /shop 搜尋欄下方圓形主分類（最多 8 個＋系統「全部分類」）。可更換文字與 logo 圖；素材建議透明 PNG／WebP 256×256。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/shop" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              返回商城 CMS
            </Link>
            <Link
              href="/admin/categories"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              完整分類樹
            </Link>
            <Button size="sm" onClick={openCreate}>
              新增主分類
            </Button>
          </div>
        }
      />

      <label className="inline-flex items-center gap-2 text-sm text-coffee">
        <input
          type="checkbox"
          checked={filterHome}
          onChange={(e) => setFilterHome(e.target.checked)}
        />
        只顯示商城首頁／大項主分類
      </label>

      {showForm ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
            <p className="text-sm font-medium text-coffee">
              {editingId ? "編輯分類" : "新增分類"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="分類名稱"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="slug（英文或拼音）"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              <Input
                placeholder="分類說明（選填）"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="sm:col-span-2"
              />
              <Input
                placeholder="自訂連結（選填，預設 /shop/category/{slug}）"
                value={form.custom_link}
                onChange={(e) => setForm({ ...form, custom_link: e.target.value })}
                className="sm:col-span-2"
              />
              <Input
                placeholder="顯示排序"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
            </div>

            <AdminImageUpload
              label="分類素材圖片"
              hint="建議透明背景 PNG／WebP、256×256、最大 1MB；不要含圓形底色"
              images={form.image_url ? [form.image_url] : []}
              onChange={(images) => setForm({ ...form, image_url: images[0] ?? "" })}
              uploadFolder="categories"
              maxImages={1}
              multiple={false}
            />

            <ColorPicker
              value={form.background_color}
              onChange={(hex) => setForm({ ...form, background_color: hex })}
            />

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                啟用
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_main_category}
                  onChange={(e) =>
                    setForm({ ...form, is_main_category: e.target.checked })
                  }
                />
                大項主分類
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.show_on_shop_home}
                  onChange={(e) =>
                    setForm({ ...form, show_on_shop_home: e.target.checked })
                  }
                />
                顯示於商城首頁
              </label>
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
            <p className="mb-3 text-sm font-medium text-coffee">前台預覽</p>
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-[88px] w-[88px] items-center justify-center rounded-full"
                style={{
                  backgroundColor:
                    normalizeCategoryHex(form.background_color) ?? "#FFF4CC",
                }}
              >
                {form.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.image_url}
                    alt=""
                    className="h-[60%] w-[60%] object-contain"
                  />
                ) : (
                  <span className="h-8 w-8 rounded-md bg-[#153E73]/10" />
                )}
              </div>
              <span className="text-sm font-medium text-[#153E73]">
                {form.name || "分類名稱"}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <AdminTable
        loading={loading}
        emptyText="尚無分類"
        columns={[
          {
            key: "name",
            header: "分類",
            render: (c) => (
              <div className="flex items-center gap-2">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: c.shop_home_bg_color || "#F1F2F7" }}
                >
                  {c.shop_home_icon || c.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.shop_home_icon || c.icon_url || ""}
                      alt=""
                      className="h-6 w-6 object-contain"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="font-medium text-coffee">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.slug}</p>
                </div>
              </div>
            ),
          },
          {
            key: "flags",
            header: "旗標",
            render: (c) => (
              <div className="flex flex-wrap gap-1">
                {c.is_main_category ? (
                  <StatusBadge label="主分類" variant="success" />
                ) : null}
                {c.show_on_shop_home ? (
                  <StatusBadge label="首頁" variant="success" />
                ) : null}
                <StatusBadge
                  label={c.is_active ? "啟用" : "停用"}
                  variant={c.is_active ? "success" : "secondary"}
                />
              </div>
            ),
          },
          {
            key: "sort",
            header: "排序",
            render: (c) => c.shop_home_sort_order ?? c.sort_order ?? 0,
          },
          {
            key: "actions",
            header: "操作",
            render: (c) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                  編輯
                </Button>
                <Button size="sm" variant="outline" onClick={() => void toggleActive(c)}>
                  {c.is_active ? "停用" : "啟用"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => void move(c, -1)}>
                  上移
                </Button>
                <Button size="sm" variant="outline" onClick={() => void move(c, 1)}>
                  下移
                </Button>
                <Button size="sm" variant="outline" onClick={() => void remove(c)}>
                  刪除
                </Button>
              </div>
            ),
          },
        ]}
        rows={visible}
      />
    </div>
  );
}
