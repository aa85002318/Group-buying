"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getCategoryDisplayIcon } from "@/lib/home";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active?: boolean;
  icon_emoji?: string | null;
  icon_url?: string | null;
  parent_id?: string | null;
  level?: number;
  path?: string | null;
  catalog_root_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at: string;
  updated_at: string;
};

const EMOJI_OPTIONS = ["🍎", "🥐", "❄️", "🏠", "💊", "💄", "🛋️", "🍪", "🛒", "🥗", "🧴", "📦", "🌾", "🥖"];

const emptyForm = {
  name: "",
  slug: "",
  icon_emoji: "",
  icon_url: "",
  seo_title: "",
  seo_description: "",
  is_active: true,
  parent_id: "",
};

function AdminCategoriesClient() {
  const searchParams = useSearchParams();
  const catalogFilter = searchParams.get("catalog") ?? "all";

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (catalogFilter === "baking-materials") params.set("catalog", "baking-materials");
    fetch(`/api/admin/categories?${params}`)
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .finally(() => setLoading(false));
  }, [catalogFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const pathA = a.path ?? a.name;
      const pathB = b.path ?? b.name;
      return pathA.localeCompare(pathB, "zh-TW");
    });
  }, [categories]);

  const parentOptions = useMemo(
    () => sortedCategories.filter((c) => !editing || c.id !== editing.id),
    [sortedCategories, editing]
  );

  const openCreate = (parentId?: string) => {
    setCreating(true);
    setEditing(null);
    setForm({ ...emptyForm, parent_id: parentId ?? "" });
  };

  const openEdit = (c: CategoryRow) => {
    setEditing(c);
    setCreating(false);
    setForm({
      name: c.name,
      slug: c.slug ?? "",
      icon_emoji: c.icon_emoji ?? "",
      icon_url: c.icon_url ?? "",
      seo_title: c.seo_title ?? "",
      seo_description: c.seo_description ?? "",
      is_active: c.is_active !== false,
      parent_id: c.parent_id ?? "",
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
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        icon_emoji: form.icon_emoji || null,
        icon_url: form.icon_url || null,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        is_active: form.is_active,
        parent_id: form.parent_id || null,
        ...(catalogFilter === "baking-materials" && creating
          ? { catalog: "baking-materials" }
          : {}),
      };

      if (creating) {
        await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (editing) {
        await fetch(`/api/admin/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      closeForm();
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: CategoryRow) => {
    await fetch(`/api/admin/categories/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !(c.is_active !== false) }),
    });
    load();
  };

  const indentLevel = (c: CategoryRow) => Math.max(0, (c.level ?? 1) - 1);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="分類管理"
        description={
          catalogFilter === "baking-materials"
            ? "烘焙材料目錄分類（樹狀結構）"
            : "編輯分類名稱、圖示與 SEO"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/categories">
              <Button variant={catalogFilter === "all" ? "default" : "outline"} size="sm">
                全部分類
              </Button>
            </Link>
            <Link href="/admin/categories?catalog=baking-materials">
              <Button
                variant={catalogFilter === "baking-materials" ? "default" : "outline"}
                size="sm"
              >
                烘焙材料
              </Button>
            </Link>
            <Button size="sm" onClick={() => openCreate()}>
              新增分類
            </Button>
          </div>
        }
      />

      {(creating || editing) && (
        <div className="space-y-4 rounded-xl bg-white p-4 shadow-card">
          <h2 className="font-medium text-coffee">
            {creating ? "新增分類" : `編輯：${editing?.name}`}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="分類名稱 *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <select
              className="rounded-lg border border-border px-3 py-2 text-sm sm:col-span-2"
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
            >
              <option value="">無上層（根分類）</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {"—".repeat(indentLevel(c))} {c.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="SEO 標題"
              value={form.seo_title}
              onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              className="sm:col-span-2"
            />
            <Input
              placeholder="SEO 描述"
              value={form.seo_description}
              onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
              className="sm:col-span-2"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-coffee">選擇 Emoji 圖示</p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, icon_emoji: emoji, icon_url: "" })}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl ${
                    form.icon_emoji === emoji ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <AdminImageUpload
            label="或上傳圖片圖示"
            hint="上傳後將優先於 emoji 顯示"
            images={form.icon_url ? [form.icon_url] : []}
            onChange={(images) => setForm({ ...form, icon_url: images[0] ?? "", icon_emoji: "" })}
            uploadFolder="categories"
            maxImages={1}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            啟用中
          </label>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.name}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
            <Button variant="secondary" onClick={closeForm}>
              取消
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p>載入中…</p>
      ) : (
        <div className="space-y-2">
          {sortedCategories.map((c) => {
            const icon = getCategoryDisplayIcon(c);
            const level = indentLevel(c);
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card"
                style={{ marginLeft: level * 16 }}
              >
                {icon.type === "image" ? (
                  <div className="relative h-10 w-10 shrink-0">
                    <Image
                      src={icon.value}
                      alt={c.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <span className="text-3xl">{icon.value}</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-coffee">{c.name}</p>
                    {c.is_active === false && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        停用
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.slug}</p>
                  {c.path && (
                    <p className="text-xs text-muted-foreground/80">{c.path}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openCreate(c.id)} title="新增子分類">
                    +
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleActive(c)}
                    title={c.is_active !== false ? "停用" : "啟用"}
                  >
                    {c.is_active !== false ? "停用" : "啟用"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                    編輯
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">載入分類管理…</p>
        </div>
      }
    >
      <AdminCategoriesClient />
    </Suspense>
  );
}
