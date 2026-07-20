"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Gift, Megaphone, Package, Store, Users } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/site-links";
import { formatDate, cn } from "@/lib/utils";
import { isSafeLinkUrl } from "@/lib/cms/safeHtml";

type Notification = {
  id: string;
  notification_type: string;
  title: string;
  summary?: string | null;
  message: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

const TABS = [
  { value: "all", label: "全部" },
  { value: "order", label: "訂單" },
  { value: "group_buy", label: "團購" },
  { value: "campaign", label: "活動" },
  { value: "benefit", label: "福利" },
  { value: "store", label: "門市公告" },
  { value: "system", label: "系統" },
] as const;

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  order: Package,
  pickup: Package,
  group_buy: Users,
  campaign: Megaphone,
  product: Megaphone,
  livestream: Megaphone,
  benefit: Gift,
  store: Store,
  system: Bell,
};

export default function MemberNotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const q = tab === "all" ? "" : `?type=${tab}`;
    fetch(`/api/member/notifications${q}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.notifications ?? []);
        setUnreadCount(d.unreadCount ?? 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
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
    if (n.link_url && isSafeLinkUrl(n.link_url)) {
      if (n.link_url.startsWith("http")) {
        window.open(n.link_url, "_blank", "noopener,noreferrer");
      } else {
        router.push(n.link_url);
      }
    } else {
      load();
    }
  };

  return (
    <RequireAuth>
      <div className="space-y-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={APP_ROUTES.member}><ArrowLeft className="h-5 w-5 text-caramel" /></Link>
            <div>
              <h1 className="text-xl font-bold text-caramel">通知中心</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-foreground-secondary">{unreadCount} 則未讀</p>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={markAllRead}>全部已讀</Button>
        </div>

        <p className="text-xs text-foreground-secondary">
          僅顯示 App 訂單、團購、活動、福利與系統訊息，不含門市 POS 消費通知。
        </p>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm",
                tab === t.value ? "bg-primary text-white" : "border border-border bg-surface text-foreground-secondary"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-[20px] bg-surface" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[20px] bg-error-soft p-6 text-center text-sm text-error">
            {error}
            <button type="button" className="mt-2 block w-full underline" onClick={load}>重試</button>
          </div>
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
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNotification(n)}
                  className={cn(
                    "flex w-full gap-3 px-4 py-4 text-left hover:bg-surface-soft",
                    !n.is_read && "bg-primary-soft/50"
                  )}
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-caramel" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{n.title}</span>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span className="mt-1 block text-sm text-foreground-secondary line-clamp-2">
                      {n.summary || n.message}
                    </span>
                    <span className="mt-1 block text-xs text-foreground-secondary">
                      {formatDate(n.created_at)}
                    </span>
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
