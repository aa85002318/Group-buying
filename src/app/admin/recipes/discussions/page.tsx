"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Recipe, RecipeDiscussion } from "@/lib/types/database";

type Row = RecipeDiscussion & { recipe_title?: string; recipe_id: string };

export default function AdminRecipeDiscussionsHubPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const listRes = await fetch("/api/admin/recipes");
        const listData = await listRes.json();
        const recipes = (listData.recipes ?? []) as Recipe[];
        const batches = await Promise.all(
          recipes.map(async (r) => {
            const res = await fetch(`/api/admin/recipes/${r.id}/discussions`);
            const data = await res.json().catch(() => ({}));
            return ((data.discussions ?? []) as RecipeDiscussion[]).map((d) => ({
              ...d,
              recipe_id: r.id,
              recipe_title: r.title,
            }));
          })
        );
        setRows(
          batches
            .flat()
            .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="問題與討論"
        description="跨食譜學生提問與討論列表。回覆請至各食譜編輯器「互動與商品」。"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無討論</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3">食譜</th>
                <th className="p-3">內容</th>
                <th className="p-3">狀態</th>
                <th className="p-3">時間</th>
                <th className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      className="text-primary underline-offset-2 hover:underline"
                      href={`/admin/recipes/${r.recipe_id}`}
                    >
                      {r.recipe_title}
                    </Link>
                  </td>
                  <td className="max-w-sm truncate p-3">{r.body || r.title || "—"}</td>
                  <td className="p-3">
                    <StatusBadge label={r.status ?? "open"} variant="secondary" />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {r.created_at ? new Date(r.created_at).toLocaleString("zh-TW") : "—"}
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/recipes/${r.recipe_id}`}>
                      <Button size="sm" variant="secondary">
                        前往回覆
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
