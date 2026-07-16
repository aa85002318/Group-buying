"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import type { ProductCategory } from "@/lib/types/database";

export default function AdminArticleNewPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    cover_image: "",
    category_id: "",
    status: "draft" as "draft" | "published",
    sort_order: "0",
  });

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

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
        }),
      });
      const data = await res.json();
      if (data.article?.id) router.push(`/admin/articles/${data.article.id}/edit`);
      else router.push("/admin/articles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="新增文章" description="建立新文章" />

      <div className="rounded-xl bg-white p-4 shadow-card space-y-4">
        <AdminImageUpload
          label="封面圖片"
          hint="選填，建議 16:9"
          images={form.cover_image ? [form.cover_image] : []}
          onChange={(images) => setForm({ ...form, cover_image: images[0] ?? "" })}
          uploadFolder="articles"
          maxImages={1}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="標題" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="網址代稱（slug）" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <select
            className="input-field"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">選擇分類（選填）</option>
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
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-coffee">文章內容</p>
          <AdminRichTextEditor
            value={form.content}
            onChange={(content) => setForm({ ...form, content })}
            placeholder="輸入文章內容，可調整文字大小與顏色…"
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
