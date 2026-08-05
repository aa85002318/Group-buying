"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminBrandFontPicker } from "@/components/admin/AdminBrandFontPicker";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import type { BrandFontId } from "@/lib/branding";
import type { ArticleCategory } from "@/lib/types/database";

function NewArticleInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [saving, setSaving] = useState(false);
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
    fetch("/api/admin/article-categories")
      .then((r) => r.json())
      .then((d) => {
        const cats = (d.categories ?? []) as ArticleCategory[];
        setCategories(cats);
        const pref = search.get("category");
        if (pref) {
          const hit = cats.find((c) => c.slug === pref);
          if (hit) setForm((f) => ({ ...f, category_id: hit.id }));
        }
      })
      .catch(() => {});
  }, [search]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
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
      const data = await res.json();
      if (data.article?.id) router.push(`/admin/articles/${data.article.id}/edit`);
      else router.push("/admin/articles");
    } finally {
      setSaving(false);
    }
  };

  const isGroupBuy = categories.find((c) => c.id === form.category_id)?.slug === "latest-group-buy";

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={isGroupBuy ? "新增團購活動（文章）" : "新增文章"}
        description="以文章方式管理；封面建議 5:2 banner。可於內文插入圖片。"
      />

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
            {categories.filter((c) => c.is_active !== false).map((c) => (
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
            placeholder="輸入文章內容，可插入圖片、調整字型…"
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

export default function AdminArticleNewPage() {
  return (
    <Suspense fallback={<p>載入中…</p>}>
      <NewArticleInner />
    </Suspense>
  );
}
