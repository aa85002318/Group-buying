"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { ArticleCategory } from "@/lib/types/database";

export default function AdminArticleCategoriesPage() {
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetch("/api/admin/article-categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/article-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "新增失敗");
      setName("");
      setSlug("");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("刪除此分類？已關聯文章的分類會清空。")) return;
    await fetch(`/api/admin/article-categories?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="文章分類"
        description="預設：最新團購、最新資訊、新品介紹。團購活動請使用「最新團購」。"
        actions={
          <Link href="/admin/articles">
            <Button variant="secondary">返回文章管理</Button>
          </Link>
        }
      />

      <div className="rounded-xl border border-border bg-white p-4 shadow-card space-y-3">
        <p className="text-sm font-semibold text-coffee">新增分類</p>
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            placeholder="分類名稱"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            className="max-w-xs"
            placeholder="slug（選填）"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <Button disabled={busy || !name.trim()} onClick={() => void add()}>
            新增
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 shadow-card">
        {loading ? (
          <p className="text-sm text-muted-foreground">載入中…</p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-semibold text-coffee">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/articles?category=${c.slug}`}
                    className="text-sm font-semibold text-primary underline"
                  >
                    查看文章
                  </Link>
                  {!["latest-group-buy", "latest-news", "new-products"].includes(c.slug) ? (
                    <Button size="sm" variant="secondary" onClick={() => void remove(c.id)}>
                      刪除
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
