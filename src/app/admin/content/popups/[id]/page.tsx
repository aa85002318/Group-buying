"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  HomepagePopupForm,
  emptyPopupForm,
  popupToForm,
  type PopupFormState,
} from "@/components/admin/HomepagePopupForm";
import { formatDate } from "@/lib/utils";
import type { HomepagePopup } from "@/lib/popups/types";

type EventRow = {
  id: string;
  event_type: string;
  occurred_at: string;
  session_id?: string | null;
};

export default function AdminPopupEditPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [form, setForm] = useState<PopupFormState | null>(null);
  const [popup, setPopup] = useState<HomepagePopup | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/popups/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setPopup(d.popup);
        setForm(popupToForm(d.popup));
        setEvents(d.events ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">載入中…</p>;
  }

  if (error || !form || !popup) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{error ?? "找不到公告"}</p>
        <Button variant="outline" onClick={load}>
          重新載入
        </Button>
        <Link href="/admin/content/popups" className="ml-2 text-sm text-primary hover:underline">
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={popup.internal_name}
        description="編輯公告內容、排程與顯示規則"
        actions={
          <Link href="/admin/content/popups">
            <Button variant="secondary">返回列表</Button>
          </Link>
        }
      />

      <div className="grid gap-3 rounded-xl border border-border bg-white p-4 text-sm shadow-card sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">曝光</p>
          <p className="text-xl font-bold">{popup.view_count ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">CTA 點擊</p>
          <p className="text-xl font-bold">{popup.click_count ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">關閉</p>
          <p className="text-xl font-bold">{popup.close_count ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">今天不再顯示</p>
          <p className="text-xl font-bold">{popup.dismiss_today_count ?? 0}</p>
        </div>
      </div>

      <HomepagePopupForm initial={form ?? emptyPopupForm()} popupId={id} />

      <section className="rounded-xl border border-border bg-white p-4 shadow-card">
        <h2 className="mb-3 font-medium text-coffee">顯示紀錄（最近 100 筆）</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無事件紀錄</p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between gap-2 border-b border-border/60 py-1.5">
                <span className="font-medium">{e.event_type}</span>
                <span className="text-xs text-muted-foreground">{formatDate(e.occurred_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
