"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Package, Radio, ShoppingBag, Truck } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/site-links";
import { formatDate } from "@/lib/utils";

type Notification = {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

const TABS = [
  { value: "all", label: "全部" },
  { value: "order", label: "訂單" },
  { value: "product", label: "商品" },
  { value: "livestream", label: "直播" },
  { value: "system", label: "系統" },
] as const;

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  order: Package,
  pickup: Truck,
  product: ShoppingBag,
  livestream: Radio,
  system: Bell,
};

export default function MemberNotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = tab === "all" ? "" : `?type=${tab}`;
    fetch(`/api/member/notifications${q}`)
      .then((r) => r.json())
      .then((d) => setItems(d.notifications ?? []))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    await fetch("/api/member/notifications/read-all", { method: "POST" });
    load();
  };

  const openNotification = async (n: Notification) => {
    if (!n.is_read) {
      await fetch(`/api/member/notifications/${n.id}/read`, { method: "PATCH" });
    }
    if (n.link_url) router.push(n.link_url);
    else load();
  };

  return (
    <RequireAuth>
      <div className="space-y-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={APP_ROUTES.member}><ArrowLeft className="h-5 w-5 text-caramel" /></Link>
            <h1 className="text-xl font-bold text-caramel">通知中心</h1>
          </div>
          <Button size="sm" variant="outline" onClick={markAllRead}>全部已讀</Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button key={t.value} type="button" onClick={() => setTab(t.value)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${tab === t.value ? "bg-primary text-white" : "bg-surface text-foreground-secondary border border-border"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-foreground-secondary">載入中…</p>
        ) : items.length === 0 ? (
          <div className="rounded-[20px] bg-surface py-16 text-center text-foreground-secondary shadow-card">
            <Bell className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-3">目前沒有通知</p>
          </div>
        ) : (
          <div className="divide-y overflow-hidden rounded-[20px] bg-surface shadow-card">
            {items.map((n) => {
              const Icon = ICONS[n.notification_type] ?? Bell;
              return (
                <button key={n.id} type="button" onClick={() => openNotification(n)} className={`flex w-full gap-3 px-4 py-4 text-left hover:bg-surface-soft ${!n.is_read ? "bg-primary-soft/50" : ""}`}>
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-caramel" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{n.title}</span>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span className="mt-1 block text-sm text-foreground-secondary line-clamp-2">{n.message}</span>
                    <span className="mt-1 block text-xs text-foreground-secondary">{formatDate(n.created_at)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
