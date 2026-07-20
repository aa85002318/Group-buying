"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { slugifyTitle } from "@/lib/videos/embed";
import type { NewsCategoryRow } from "@/lib/types/database";

export default function AdminNewsNewPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<NewsCategoryRow[]>([]);
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
    seo_title: "",
    seo_description: "",
  });

  useEffect(() => {
    fetch("/api/admin/news")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  const save = async () => {
    if (!form.title.trim()) {
      alert("請填寫標題");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: form.slug.trim() || slugifyTitle(form.title),
          cover_image: form.cover_image || null,
          category_id: form.category_id || null,
          related_url: form.related_url || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      router.push(`/admin/news/${data.post.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="新增最新資訊" />
      <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
        <AdminImageUpload
          label="封面"
          images={form.cover_image ? [form.cover_image] : []}
          onChange={(images) => setForm({ ...form, cover_image: images[0] ?? "" })}
          uploadFolder="news"
          maxImages={1}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="標題" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
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
        <textarea className="input-field min-h-[72px]" placeholder="摘要" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <textarea className="input-field min-h-[160px]" placeholder="內文（HTML 會消毒）" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <Input placeholder="相關連結（內部路徑或 https）" value={form.related_url} onChange={(e) => setForm({ ...form, related_url: e.target.value })} />
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
            置頂
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_important} onChange={(e) => setForm({ ...form, is_important: e.target.checked })} />
            重要
          </label>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</Button>
          <Button variant="secondary" onClick={() => router.push("/admin/news")}>取消</Button>
        </div>
      </div>
    </div>
  );
}
