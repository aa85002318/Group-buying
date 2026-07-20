"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import type { NewsPost } from "@/lib/types/database";

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  scheduled: "排程",
  published: "已發布",
  archived: "已下架",
};

export default function AdminNewsPage() {
  const router = useRouter();
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } =
    useAdminList<NewsPost>("/api/admin/news", "posts", ["title", "slug"]);

  const remove = async (id: string) => {
    if (!confirm("確定刪除此資訊？")) return;
    await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="最新資訊"
        description="新品、活動、門市與系統公告管理"
        actions={<Button onClick={() => router.push("/admin/news/new")}>新增資訊</Button>}
      />

      <AdminTable
        columns={[
          { key: "title", header: "標題", render: (n) => n.title },
          {
            key: "category",
            header: "分類",
            render: (n) => n.news_categories?.name ?? "—",
          },
          {
            key: "status",
            header: "狀態",
            render: (n) => (
              <StatusBadge
                label={STATUS_LABEL[n.status] ?? n.status}
                variant={n.status === "published" ? "success" : "secondary"}
              />
            ),
          },
          {
            key: "flags",
            header: "標記",
            render: (n) => (
              <span className="text-xs">
                {n.is_featured ? "置頂 " : ""}
                {n.is_important ? "重要" : ""}
                {!n.is_featured && !n.is_important ? "—" : ""}
              </span>
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (n) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => router.push(`/admin/news/${n.id}`)}>
                  編輯
                </Button>
                <Link href={`/news/${n.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">預覽</Button>
                </Link>
                <Button size="sm" variant="outline" onClick={() => remove(n.id)}>
                  刪除
                </Button>
              </div>
            ),
          },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyText="尚無最新資訊"
      />
    </div>
  );
}
