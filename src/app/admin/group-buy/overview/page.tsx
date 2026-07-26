"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { computeGroupBuyRuntimeStatus } from "@/lib/group-buy/page-settings";
import { formatDate } from "@/lib/utils";
import type { GroupBuyEvent } from "@/lib/types/database";

type EventRow = GroupBuyEvent & {
  group_buy_products?: unknown[] | null;
};

export default function AdminGroupBuyOverviewPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/group-buy-events")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    let active = 0;
    let endingSoon = 0;
    let upcoming = 0;
    let ended = 0;
    for (const e of events) {
      const runtime = computeGroupBuyRuntimeStatus({
        status: e.status,
        start_at: e.start_at,
        end_at: e.end_at,
        endingSoonHours: 48,
        now,
      });
      if (runtime === "active") active += 1;
      else if (runtime === "ending_soon") endingSoon += 1;
      else if (runtime === "upcoming") upcoming += 1;
      else if (runtime === "ended") ended += 1;
    }
    return { active, endingSoon, upcoming, ended, total: events.length };
  }, [events]);

  const closing = useMemo(() => {
    return [...events]
      .filter((e) => {
        const r = computeGroupBuyRuntimeStatus({
          status: e.status,
          start_at: e.start_at,
          end_at: e.end_at,
          endingSoonHours: 48,
        });
        return r === "ending_soon" || r === "active";
      })
      .sort((a, b) => new Date(a.end_at).getTime() - new Date(b.end_at).getTime())
      .slice(0, 8);
  }, [events]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="團購總覽"
        description="進行中／即將結團狀態一覽（依開始與結束時間自動計算）"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/group-buy">
              <Button variant="secondary">團購活動</Button>
            </Link>
            <Link href="/admin/group-buy/settings">
              <Button variant="outline">頁面設定</Button>
            </Link>
            <Link href="/admin/orders?type=group_buy">
              <Button>團購訂單</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "全部活動", value: stats.total },
          { label: "進行中", value: stats.active },
          { label: "即將結團", value: stats.endingSoon },
          { label: "即將開團", value: stats.upcoming },
          { label: "已結團", value: stats.ended },
        ].map((c) => (
          <div key={c.label} className="rounded-[20px] border border-border bg-white p-4 shadow-card">
            <p className="text-xs text-foreground-secondary">{c.label}</p>
            <p className="mt-1 text-2xl font-black">{loading ? "…" : c.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-bold">近期結團</h2>
        {closing.length === 0 ? (
          <p className="text-sm text-foreground-secondary">目前沒有進行中的團購</p>
        ) : (
          <ul className="divide-y divide-border">
            {closing.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-xs text-foreground-secondary">
                    {formatDate(e.start_at)} — {formatDate(e.end_at)}
                  </p>
                </div>
                <Link href="/admin/group-buy" className="text-primary hover:underline">
                  管理
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
