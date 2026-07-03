"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import type { Article } from "@/lib/types/database";

export default function AdminArticlesPage() {
  const router = useRouter();
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<Article>(
    "/api/admin/articles",
    "articles",
    ["title", "slug"]
  );

  const remove = async (id: string) => {
    if (!confirm("確定要刪除此文章？")) return;
    await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="文章管理"
        description="部落格與公告文章"
        actions={
          <Button onClick={() => router.push("/admin/articles/new")}>新增文章</Button>
        }
      />

      <AdminTable
        columns={[
          { key: "title", header: "標題", render: (a) => a.title },
          { key: "slug", header: "網址代稱", render: (a) => a.slug },
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
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => router.push(`/admin/articles/${a.id}/edit`)}>
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
        前台預覽：<Link href="/articles" className="text-primary">/articles</Link>
      </p>
    </div>
  );
}
