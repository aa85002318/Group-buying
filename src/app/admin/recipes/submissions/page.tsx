"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Recipe, RecipeSubmission } from "@/lib/types/database";

type Row = RecipeSubmission & { recipe_title?: string; recipe_id: string };

export default function AdminRecipeSubmissionsHubPage() {
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
            const res = await fetch(`/api/admin/recipes/${r.id}/submissions`);
            const data = await res.json().catch(() => ({}));
            return ((data.submissions ?? []) as RecipeSubmission[]).map((s) => ({
              ...s,
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

  const moderate = async (row: Row, status: string) => {
    await fetch(`/api/admin/recipes/${row.recipe_id}/submissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, moderation_status: status }),
    });
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, moderation_status: status as Row["moderation_status"] } : r))
    );
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="作品審核"
        description="跨食譜成品分享列表。詳細回覆可進入各食譜編輯器「互動與商品」區段。"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無投稿</p>
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
                    <Link className="text-primary underline-offset-2 hover:underline" href={`/admin/recipes/${r.recipe_id}`}>
                      {r.recipe_title}
                    </Link>
                  </td>
                  <td className="max-w-xs truncate p-3">{r.title || r.note || "—"}</td>
                  <td className="p-3">
                    <StatusBadge label={r.moderation_status ?? "pending"} variant="secondary" />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {r.created_at ? new Date(r.created_at).toLocaleString("zh-TW") : "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => moderate(r, "approved")}>
                        通過
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => moderate(r, "rejected")}>
                        拒絕
                      </Button>
                    </div>
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
