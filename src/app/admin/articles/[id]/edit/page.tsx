"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminBrandFontPicker } from "@/components/admin/AdminBrandFontPicker";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import type { BrandFontId } from "@/lib/branding";
import type { Article, ArticleCategory } from "@/lib/types/database";

export default function AdminArticleEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    cover_image: "",
    category_id: "",
    status: "draft" as "draft" | "published",
    sort_order: "0",
    is_featured: false,
    title_font: null as BrandFontId | null,
    body_font: null as BrandFontId | null,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/articles/${params.id}`).then((r) => r.json()),
      fetch("/api/admin/article-categories").then((r) => r.json()),
    ])
      .then(([articleRes, catRes]) => {
        const a = articleRes.article as Article | undefined;
        if (a) {
          setForm({
            title: a.title,
            slug: a.slug,
            content: a.content,
            cover_image: a.cover_image ?? "",
            category_id: a.category_id ?? "",
            status: a.status,
            sort_order: String(a.sort_order),
            is_featured: Boolean(a.is_featured),
            title_font: (a.title_font as BrandFontId | null) ?? null,
            body_font: (a.body_font as BrandFontId | null) ?? null,
          });
        }
        setCategories(catRes.categories ?? []);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/articles/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cover_image: form.cover_image || null,
          category_id: form.category_id || null,
          sort_order: Number(form.sort_order),
          is_featured: form.is_featured,
          title_font: form.title_font,
          body_font: form.body_font,
        }),
      });
      router.push("/admin/articles");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>載入中…</p>;

  return (
    <div className="space-y-4">
      <AdminPageHeader title="編輯文章" description="修改內容、分類與 5:2 封面" />

      <div className="rounded-xl bg-white p-4 shadow-card space-y-4">
        <AdminImageUpload
          label="首頁／封面 Banner"
          hint="建議比例 5:2"
          aspectRatio="banner52"
          images={form.cover_image ? [form.cover_image] : []}
          onChange={(images) => setForm({ ...form, cover_image: images[0] ?? "" })}
          uploadFolder="articles"
          maxImages={1}
          multiple={false}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="標題" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="網址代稱（slug）" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <select
            className="input-field"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">選擇文章分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            className="input-field"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}
          >
            <option value="draft">草稿</option>
            <option value="published">已發布</option>
          </select>
          <Input
            placeholder="排序"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-coffee sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            置頂顯示於首頁
          </label>
        </div>

        <section className="space-y-4 rounded-xl border border-[#E9DED4] bg-[#FFFCF7] p-4">
          <h2 className="text-base font-bold text-coffee">文章字型</h2>
          <AdminBrandFontPicker
            label="標題字型"
            value={form.title_font}
            onChange={(id) => setForm({ ...form, title_font: id })}
            allowSiteDefault
          />
          <AdminBrandFontPicker
            label="內文字型"
            value={form.body_font}
            onChange={(id) => setForm({ ...form, body_font: id })}
            allowSiteDefault
          />
        </section>

        <div>
          <p className="mb-2 text-sm font-medium text-coffee">文章內容</p>
          <AdminRichTextEditor
            value={form.content}
            onChange={(content) => setForm({ ...form, content })}
            placeholder="輸入文章內容，可插入圖片…"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving || !form.title}>儲存</Button>
          <Button variant="secondary" onClick={() => router.push("/admin/articles")}>取消</Button>
        </div>
      </div>
    </div>
  );
}
