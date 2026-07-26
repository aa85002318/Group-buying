"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import type { GroupBuyEvent } from "@/lib/types/database";

/**
 * Lightweight category hub — labels come from each event's category_label.
 * Does not create a second catalog; edit labels on the event form.
 */
export default function AdminGroupBuyCategoriesPage() {
  const [events, setEvents] = useState<GroupBuyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/group-buy-events")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const map = new Map<string, number>();
    let uncategorized = 0;
    for (const e of events) {
      const label = (e.category_label ?? "").trim();
      if (!label) {
        uncategorized += 1;
        continue;
      }
      map.set(label, (map.get(label) ?? 0) + 1);
    }
    const list = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-TW"));
    return { list, uncategorized };
  }, [events]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="團購分類"
        description="分類取自各團購活動的「團購分類標籤」欄位，不另建商品分類表"
        actions={
          <Link href="/admin/group-buy">
            <Button>前往團購活動</Button>
          </Link>
        }
      />

      <div className="rounded-[20px] border border-border bg-white p-5 shadow-card">
        {loading ? (
          <p className="text-sm text-foreground-secondary">載入中…</p>
        ) : rows.list.length === 0 && rows.uncategorized === 0 ? (
          <p className="text-sm text-foreground-secondary">尚無團購活動</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-foreground-secondary">
              <tr>
                <th className="px-2 py-2">分類</th>
                <th className="px-2 py-2 text-right">活動數</th>
              </tr>
            </thead>
            <tbody>
              {rows.list.map((r) => (
                <tr key={r.name} className="border-t border-border">
                  <td className="px-2 py-2 font-medium">{r.name}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{r.count}</td>
                </tr>
              ))}
              {rows.uncategorized > 0 && (
                <tr className="border-t border-border text-foreground-secondary">
                  <td className="px-2 py-2">未分類</td>
                  <td className="px-2 py-2 text-right tabular-nums">{rows.uncategorized}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <p className="mt-4 text-xs text-foreground-secondary">
          若要調整分類名稱，請到「團購活動」編輯各團的分類標籤。
        </p>
      </div>
    </div>
  );
}
