"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  FileQuestion,
  Headphones,
  MessageSquare,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";

type Ticket = { id: string; status: string; subject?: string; created_at?: string };

const WORKSPACE: Array<{ title: string; href: string; Icon: LucideIcon; tone: string }> = [
  { title: "客服工單", href: "/admin/support", Icon: Headphones, tone: "#FFF5CC" },
  { title: "App 訂單", href: "/admin/orders", Icon: ShoppingBag, tone: "#EEF8FC" },
  { title: "會員查詢", href: "/admin/members", Icon: Users, tone: "#EFF9EE" },
  { title: "通知管理", href: "/admin/notifications", Icon: Bell, tone: "#FFF0EE" },
  { title: "FAQ", href: "/admin/faqs", Icon: FileQuestion, tone: "#F3EEFF" },
  { title: "客服設定", href: "/admin/support-settings", Icon: MessageSquare, tone: "#EEF8FC" },
];

function greeting(name?: string | null) {
  const hour = new Date().getHours();
  const hi = hour < 12 ? "早安" : hour < 18 ? "午安" : "晚安";
  return `${hi}，${name?.trim() || "客服"}`;
}

export function CustomerServiceHome({ fullName }: { fullName?: string | null }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/support-tickets")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setTickets(d.tickets ?? []);
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  const openCount = useMemo(
    () => tickets.filter((t) => t.status === "open" || t.status === "in_progress").length,
    [tickets]
  );
  const recentOpen = useMemo(
    () =>
      tickets
        .filter((t) => t.status === "open" || t.status === "in_progress")
        .slice(0, 8),
    [tickets]
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-[var(--admin-muted)]">客服工作台</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--admin-title)] md:text-[30px]">
          {greeting(fullName)}
        </h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          處理會員工單、App 訂單與會員查詢。不含門市 POS／營業額報表。
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/support"
          className="rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]"
        >
          <p className="text-sm text-[var(--admin-muted)]">待處理工單</p>
          <p className="mt-1 text-3xl font-bold text-[var(--admin-title)]">
            {loading ? "…" : openCount}
          </p>
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]"
        >
          <p className="text-sm text-[var(--admin-muted)]">App 訂單</p>
          <p className="mt-1 text-lg font-bold text-[var(--admin-title)]">查詢／協助會員</p>
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-[var(--admin-title)]">工作區</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {WORKSPACE.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-[104px] flex-col justify-between rounded-[24px] p-4 shadow-[0_10px_35px_rgba(0,0,0,.05)]"
              style={{ background: item.tone }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-[var(--admin-title)]">
                <item.Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-bold text-[var(--admin-title)]">{item.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[var(--admin-title)]">最近待處理工單</h2>
          <Link href="/admin/support" className="text-sm font-semibold text-[var(--admin-title)] underline">
            全部工單
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--admin-muted)]">載入中…</p>
        ) : recentOpen.length === 0 ? (
          <p className="text-sm text-[var(--admin-muted)]">目前沒有待處理工單。</p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {recentOpen.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="font-medium text-[var(--admin-title)]">{t.subject || t.id}</span>
                <span className="shrink-0 text-xs text-[var(--admin-muted)]">
                  {t.status === "open" ? "待處理" : "處理中"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
