"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { VideoEmbed } from "@/components/videos/VideoEmbed";
import { parseVideoEmbedUrl } from "@/lib/videos/embed";
import type { Video } from "@/lib/types/database";

export default function AdminVideoEditPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    video_url: "",
    summary: "",
    description: "",
    thumbnail_url: "",
    category: "",
    duration_seconds: "",
    status: "published",
    is_active: true,
    seo_title: "",
    seo_description: "",
  });

  useEffect(() => {
    fetch("/api/admin/videos")
      .then((r) => r.json())
      .then((d) => {
        const v = (d.videos as Video[] | undefined)?.find((x) => x.id === id);
        if (!v) return;
        setForm({
          title: v.title ?? "",
          slug: v.slug ?? "",
          video_url: v.video_url ?? "",
          summary: v.summary ?? "",
          description: v.description ?? "",
          thumbnail_url: v.thumbnail_url ?? "",
          category: v.category ?? "",
          duration_seconds: v.duration_seconds != null ? String(v.duration_seconds) : "",
          status: v.status ?? "published",
          is_active: v.is_active,
          seo_title: v.seo_title ?? "",
          seo_description: v.seo_description ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    const parsed = parseVideoEmbedUrl(form.video_url);
    if (parsed.kind === "invalid") {
      alert(parsed.error ?? "影片網址無效");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
          video_type: parsed.kind,
          is_active: form.status === "published",
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
        title={`編輯影音：${form.title || id}`}
        actions={
          <div className="flex gap-2">
            <Link href={`/videos/${form.slug || id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">預覽</Button>
            </Link>
            <Button variant="secondary" onClick={() => router.push("/admin/videos")}>
              返回
            </Button>
          </div>
        }
      />

      <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
        {form.video_url && <VideoEmbed url={form.video_url} title={form.title} />}
        <Input placeholder="標題" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <Input placeholder="影片網址" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
        <Input placeholder="縮圖" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
        <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="">未分類</option>
          <option>一分鐘教你做</option>
          <option>完整教學</option>
          <option>直播回放</option>
          <option>烘焙技巧</option>
          <option>老師專欄</option>
        </select>
        <Input type="number" placeholder="長度（秒）" value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: e.target.value })} />
        <textarea className="input-field min-h-[72px]" placeholder="摘要" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <textarea className="input-field min-h-[72px]" placeholder="說明" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="draft">草稿</option>
          <option value="published">發布</option>
          <option value="archived">下架</option>
        </select>
        <Button onClick={save} disabled={saving}>
          {saving ? "儲存中…" : "儲存"}
        </Button>
      </div>
    </div>
  );
}
