"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import type { Article, ArticleCategory } from "@/lib/types/database";
import { cn } from "@/lib/utils";

function ArticlesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") ?? "";
  const [categories, setCategories] = useState<ArticleCategory[]>([]);

  const apiPath = useMemo(
    () =>
      categorySlug
        ? `/api/admin/articles?category=${encodeURIComponent(categorySlug)}`
        : "/api/admin/articles",
    [categorySlug]
  );

  const { items, paginated, search, setSearch, page, setPage, totalPages, refresh, loading } =
    useAdminList<Article>(apiPath, "articles", ["title", "slug"]);

  useEffect(() => {
    fetch("/api/admin/article-categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [apiPath]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id: string) => {
    if (!confirm("確定要刪除此文章？")) return;
    await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    refresh();
  };

  const patch = async (id: string, updates: Record<string, unknown>) => {
    await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    refresh();
  };

  const move = async (article: Article, dir: -1 | 1) => {
    const sorted = [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = sorted.findIndex((a) => a.id === article.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await Promise.all([
      patch(article.id, { sort_order: swap.sort_order }),
      patch(swap.id, { sort_order: article.sort_order }),
    ]);
  };

  const activeCat = categories.find((c) => c.slug === categorySlug);
  const newHref = categorySlug
    ? `/admin/articles/new?category=${encodeURIComponent(categorySlug)}`
    : "/admin/articles/new";

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={activeCat?.slug === "latest-group-buy" ? "團購活動（文章）" : "文章管理"}
        description="分類：最新團購／最新資訊／新品介紹。封面使用 5:2 banner；內文可插入圖片。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push(newHref)}>
              {activeCat?.slug === "latest-group-buy" ? "新增團購活動" : "新增文章"}
            </Button>
            <Link
              href="/admin/articles/categories"
              className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-caramel"
            >
              文章分類
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => router.push("/admin/articles")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-semibold",
            !categorySlug
              ? "border-[#FFE149] bg-[#FFE149] text-[#153E73]"
              : "border-border bg-white text-coffee"
          )}
        >
          全部
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => router.push(`/admin/articles?category=${c.slug}`)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold",
              categorySlug === c.slug
                ? "border-[#FFE149] bg-[#FFE149] text-[#153E73]"
                : "border-border bg-white text-coffee"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <AdminTable
        columns={[
          { key: "title", header: "標題", render: (a) => a.title },
          {
            key: "category",
            header: "分類",
            render: (a) => a.article_categories?.name ?? "—",
          },
          { key: "slug", header: "網址代稱", render: (a) => a.slug },
          {
            key: "featured",
            header: "置頂",
            render: (a) => (
              <Button
                size="sm"
                variant={a.is_featured ? "default" : "outline"}
                onClick={() => patch(a.id, { is_featured: !a.is_featured })}
              >
                {a.is_featured ? "已置頂" : "設置頂"}
              </Button>
            ),
          },
          {
            key: "status",
            header: "狀態",
            render: (a) => (
              <StatusBadge
                label={a.status === "published" ? "已發布" : "草稿"}
                variant={a.status === "published" ? "success" : "secondary"}
              />
            ),
          },
          { key: "sort", header: "排序", render: (a) => a.sort_order },
          {
            key: "actions",
            header: "操作",
            render: (a) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => move(a, -1)} aria-label="上移">
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => move(a, 1)} aria-label="下移">
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => router.push(`/admin/articles/${a.id}/edit`)}
                >
                  編輯
                </Button>
                <Button size="sm" variant="secondary" onClick={() => remove(a.id)}>
                  刪除
                </Button>
              </div>
            ),
          },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋標題或網址代稱…"
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

export default function AdminArticlesPage() {
  return (
    <Suspense fallback={<p>載入中…</p>}>
      <ArticlesInner />
    </Suspense>
  );
}
