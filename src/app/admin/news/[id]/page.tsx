"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { NewsCategoryRow, NewsPost } from "@/lib/types/database";

export default function AdminNewsEditPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const router = useRouter();
  const [categories, setCategories] = useState<NewsCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    summary: "",
    cover_image: "",
    category_id: "",
    content: "",
    status: "draft",
    is_featured: false,
    is_important: false,
    related_url: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/news/${id}`).then((r) => r.json()),
      fetch("/api/admin/news").then((r) => r.json()),
    ])
      .then(([detail, list]) => {
        setCategories(list.categories ?? []);
        const p = detail.post as NewsPost | undefined;
        if (!p) return;
        setForm({
          title: p.title ?? "",
          slug: p.slug ?? "",
          summary: p.summary ?? "",
          cover_image: p.cover_image ?? "",
          category_id: p.category_id ?? "",
          content: p.content ?? "",
          status: p.status ?? "draft",
          is_featured: Boolean(p.is_featured),
          is_important: Boolean(p.is_important),
          related_url: p.related_url ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/news/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cover_image: form.cover_image || null,
          category_id: form.category_id || null,
          related_url: form.related_url || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      alert("已儲存");
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">載入中…</p>;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={`編輯：${form.title || id}`}
        actions={
          <div className="flex gap-2">
            <Link href={`/news/${form.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">預覽</Button>
            </Link>
            <Button variant="secondary" onClick={() => router.push("/admin/news")}>返回</Button>
          </div>
        }
      />
      <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
        <AdminImageUpload
          label="封面"
          images={form.cover_image ? [form.cover_image] : []}
          onChange={(images) => setForm({ ...form, cover_image: images[0] ?? "" })}
          uploadFolder="news"
          maxImages={1}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="標題" />
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug" />
          <select className="input-field" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">選擇分類</option>
            {categories.filter((c) => c.slug !== "all").map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">草稿</option>
            <option value="scheduled">排程</option>
            <option value="published">發布</option>
            <option value="archived">下架</option>
          </select>
        </div>
        <textarea className="input-field min-h-[72px]" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="摘要" />
        <textarea className="input-field min-h-[160px]" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="內文" />
        <Input value={form.related_url} onChange={(e) => setForm({ ...form, related_url: e.target.value })} placeholder="相關連結" />
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
            置頂
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_important} onChange={(e) => setForm({ ...form, is_important: e.target.checked })} />
            重要
          </label>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</Button>
      </div>
    </div>
  );
}
