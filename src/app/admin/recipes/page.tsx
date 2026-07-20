"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import type { Recipe } from "@/lib/types/database";

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  scheduled: "排程",
  published: "已發布",
  archived: "已下架",
};

export default function AdminRecipesPage() {
  const router = useRouter();
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } =
    useAdminList<Recipe>("/api/admin/recipes", "recipes", ["title", "slug"]);

  const remove = async (id: string) => {
    if (!confirm("確定刪除此食譜？")) return;
    await fetch(`/api/admin/recipes/${id}`, { method: "DELETE" });
    refresh();
  };

  const duplicate = async (r: Recipe) => {
    const res = await fetch("/api/admin/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${r.title}（複製）`,
        slug: `${r.slug}-copy-${Date.now().toString(36)}`,
        summary: r.summary,
        cover_image: r.cover_image,
        category_id: r.category_id,
        difficulty: r.difficulty,
        prep_time: r.prep_time,
        cook_time: r.cook_time,
        total_time: r.total_time,
        servings: r.servings,
        content: r.content,
        tips: r.tips,
        storage_method: r.storage_method,
        status: "draft",
      }),
    });
    const data = await res.json();
    if (data.recipe?.id) router.push(`/admin/recipes/${data.recipe.id}`);
    else refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="食譜管理"
        description="新增、草稿、發布與下架烘焙食譜（不含 AI 生成）"
        actions={
          <Button onClick={() => router.push("/admin/recipes/new")}>新增食譜</Button>
        }
      />

      <AdminTable
        columns={[
          { key: "title", header: "標題", render: (r) => r.title },
          { key: "slug", header: "Slug", render: (r) => <span className="font-mono text-xs">{r.slug}</span> },
          {
            key: "category",
            header: "分類",
            render: (r) => r.recipe_categories?.name ?? "—",
          },
          {
            key: "status",
            header: "狀態",
            render: (r) => (
              <StatusBadge
                label={STATUS_LABEL[r.status] ?? r.status}
                variant={r.status === "published" ? "success" : "secondary"}
              />
            ),
          },
          {
            key: "featured",
            header: "精選",
            render: (r) => (r.is_featured ? "是" : "—"),
          },
          {
            key: "actions",
            header: "操作",
            render: (r) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => router.push(`/admin/recipes/${r.id}`)}>
                  編輯
                </Button>
                <Link href={`/recipes/${r.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">
                    預覽
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={() => duplicate(r)}>
                  複製
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(r.id)}>
                  刪除
                </Button>
              </div>
            ),
          },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋標題或 slug…"
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyText="尚無食譜"
      />
    </div>
  );
}
