"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Recipe } from "@/lib/types/database";

type RecipeListItem = Recipe & { story_page_count?: number; story_chapter_count?: number };

export default function AdminRecipeLayoutsPage() {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/recipes")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.recipes ?? []) as RecipeListItem[];
        setRecipes(list.filter((r) => (r.story_page_count ?? 0) > 0 || r.flip_mode_enabled !== false));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="翻頁版型"
        description="翻頁食譜沿用既有 Story 頁面型別（封面、目錄、步驟、計時、檢查點等）。從此處進入編輯器的「翻頁編輯器」頁籤。"
      />

      <div className="rounded-xl bg-white p-4 shadow-card">
        <h2 className="text-sm font-semibold">支援的頁面型別</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          cover、toc、chapter、ingredients、tools、preparation、step、comparison、timer、checkpoint、recommendations、submissions、completion
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          背景色與文字色寫入各頁 <code className="text-xs">content_config</code>，不另建欄位。
        </p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-card">
        <h2 className="mb-3 text-sm font-semibold">含翻頁內容的食譜</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">載入中…</p>
        ) : recipes.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無翻頁食譜</p>
        ) : (
          <ul className="divide-y">
            {recipes.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.story_page_count ?? 0} 頁 · {r.story_chapter_count ?? 0} 章
                  </p>
                </div>
                <Link href={`/admin/recipes/${r.id}`}>
                  <Button size="sm" variant="secondary">
                    開啟編輯器
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
