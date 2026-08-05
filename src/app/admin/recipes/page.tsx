"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import type { Recipe, RecipeAccessPermission, RecipeCategory } from "@/lib/types/database";

type RecipeListItem = Recipe & {
  story_page_count?: number;
  story_chapter_count?: number;
  updated_by_profile?: { id: string; full_name: string | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  preview: "預覽",
  scheduled: "排程",
  published: "已發布",
  archived: "已下架",
};

const ACCESS_LABEL: Record<RecipeAccessPermission | string, string> = {
  public: "公開",
  member: "會員",
  membership: "付費會員",
  purchase: "購買解鎖",
  code: "兌換碼",
  allowlist: "白名單",
  scheduled_access: "排程開放",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "簡單",
  medium: "中等",
  hard: "進階",
};

export default function AdminRecipesPage() {
  const router = useRouter();
  const { items, search, setSearch, page, setPage, refresh, loading } = useAdminList<RecipeListItem>(
    "/api/admin/recipes",
    "recipes",
    ["title", "slug"]
  );
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [accessFilter, setAccessFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [sortBy, setSortBy] = useState<"updated_at" | "title" | "status">("updated_at");

  useEffect(() => {
    void fetch("/api/admin/recipes")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    let list = items;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) list = list.filter((r) => r.category_id === categoryFilter);
    if (statusFilter) list = list.filter((r) => r.status === statusFilter);
    if (accessFilter) {
      list = list.filter((r) => (r.access_permission ?? "public") === accessFilter);
    }
    if (modeFilter === "flip") {
      list = list.filter((r) => r.flip_mode_enabled !== false && r.reading_mode_default !== "full");
    } else if (modeFilter === "full") {
      list = list.filter((r) => r.reading_mode_default === "full");
    } else if (modeFilter === "both") {
      list = list.filter((r) => r.flip_mode_enabled !== false && r.full_reading_enabled !== false);
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title, "zh-Hant");
      if (sortBy === "status") return String(a.status).localeCompare(String(b.status));
      return String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? ""));
    });
    return sorted;
  }, [items, search, categoryFilter, statusFilter, accessFilter, modeFilter, sortBy]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const remove = async (id: string) => {
    if (!confirm("確定刪除此食譜？")) return;
    await fetch(`/api/admin/recipes/${id}`, { method: "DELETE" });
    refresh();
  };

  const setStatus = async (r: RecipeListItem, status: string) => {
    await fetch(`/api/admin/recipes/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  };

  const duplicate = async (r: RecipeListItem) => {
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
        allergens: r.allergens ?? [],
        access_permission: r.access_permission ?? "public",
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
        title="全部食譜"
        description="管理烘焙食譜：草稿、預覽、發布、下架與翻頁內容"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/recipes/settings")}>
              食譜頁設定
            </Button>
            <Button onClick={() => router.push("/admin/recipes/new")}>新增食譜</Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-3 shadow-card">
        <label className="space-y-1 text-xs text-muted-foreground">
          分類
          <select
            className="input-field min-w-[8rem]"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部</option>
            {categories
              .filter((c) => c.slug !== "all")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          狀態
          <select
            className="input-field min-w-[7rem]"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          權限
          <select
            className="input-field min-w-[7rem]"
            value={accessFilter}
            onChange={(e) => {
              setAccessFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部</option>
            {Object.entries(ACCESS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          閱讀模式
          <select
            className="input-field min-w-[7rem]"
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部</option>
            <option value="flip">翻頁為主</option>
            <option value="full">完整閱讀</option>
            <option value="both">雙模式</option>
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          排序
          <select
            className="input-field min-w-[7rem]"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="updated_at">最近更新</option>
            <option value="title">標題</option>
            <option value="status">狀態</option>
          </select>
        </label>
        <div className="min-w-[12rem] flex-1 space-y-1 text-xs text-muted-foreground">
          搜尋
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="標題或 slug…"
          />
        </div>
      </div>

      <AdminTable
        columns={[
          {
            key: "cover",
            header: "封面",
            render: (r) =>
              r.cover_image ? (
                <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                  <Image src={r.cover_image} alt="" fill className="object-cover" sizes="48px" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
                  無圖
                </div>
              ),
          },
          {
            key: "title",
            header: "標題",
            render: (r) => (
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="font-mono text-xs text-muted-foreground">{r.slug}</p>
              </div>
            ),
          },
          {
            key: "category",
            header: "分類",
            render: (r) => r.recipe_categories?.name ?? "—",
          },
          {
            key: "difficulty",
            header: "難度",
            render: (r) => DIFFICULTY_LABEL[r.difficulty] ?? r.difficulty ?? "—",
          },
          {
            key: "pages",
            header: "翻頁數",
            render: (r) => r.story_page_count ?? 0,
          },
          {
            key: "mode",
            header: "閱讀模式",
            render: (r) =>
              r.reading_mode_default === "full"
                ? "完整"
                : r.flip_mode_enabled !== false
                  ? "翻頁"
                  : "—",
          },
          {
            key: "access",
            header: "權限",
            render: (r) => ACCESS_LABEL[r.access_permission ?? "public"] ?? "公開",
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
            key: "updated",
            header: "更新",
            render: (r) => (
              <div className="text-xs text-muted-foreground">
                <p>{r.updated_at ? new Date(r.updated_at).toLocaleString("zh-TW") : "—"}</p>
                <p>{r.updated_by_profile?.full_name ?? "—"}</p>
              </div>
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (r) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => router.push(`/admin/recipes/${r.id}`)}>
                  編輯
                </Button>
                <Link
                  href={`/recipes/${r.slug}?view=flip`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline">
                    預覽
                  </Button>
                </Link>
                {r.status === "published" ? (
                  <Button size="sm" variant="outline" onClick={() => setStatus(r, "archived")}>
                    下架
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setStatus(r, "published")}>
                    上架
                  </Button>
                )}
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
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyText="尚無食譜"
      />
    </div>
  );
}
