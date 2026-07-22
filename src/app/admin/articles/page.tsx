"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import type { Article } from "@/lib/types/database";

export default function AdminArticlesPage() {
  const router = useRouter();
  const { items, paginated, search, setSearch, page, setPage, totalPages, refresh, loading } =
    useAdminList<Article>("/api/admin/articles", "articles", ["title", "slug"]);

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

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="文章管理"
        description="首頁「最新資訊」由此管理：新增文章、置頂、調整排序。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/admin/articles/new")}>新增文章</Button>
            <Link
              href="/admin/home"
              className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-caramel"
            >
              返回首頁管理
            </Link>
          </div>
        }
      />

      <AdminTable
        columns={[
          { key: "title", header: "標題", render: (a) => a.title },
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

      <p className="text-sm text-muted-foreground">
        前台預覽：
        <Link href="/articles" className="text-primary">
          /articles
        </Link>
      </p>
    </div>
  );
}
