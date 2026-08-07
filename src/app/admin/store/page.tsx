"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  MessageSquare,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Wrench,
} from "lucide-react";
import {
  STORE_QUICK_ACTIONS,
  greetingForHour,
  todayISO,
} from "@/lib/admin/store-ops";
import { requestTypeLabel } from "@/lib/admin/store-pos-lite";
import { StoreTodoCalendar, type WorkTabId } from "@/components/admin/store/StoreTodoCalendar";
import { StoreStockLookup } from "@/components/admin/store/StoreStockLookup";
import { cn } from "@/lib/utils";

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type Metrics = {
  expiring7: number;
  openIssues: number;
  openReturns: number;
  pendingRequests?: number;
  pendingCustomerOrders?: number;
  pendingPriceInquiries?: number;
  unreadMessages?: number;
  unreadNotifications?: number;
};

type Todo = { priority: number; label: string; href: string; count?: number };
type ChecklistItem = {
  id: string;
  label: string;
  href?: string | null;
  is_done?: boolean;
};
type StoreRequest = {
  id: string;
  product_label?: string | null;
  quantity?: number | null;
  note?: string | null;
  status?: string;
  requested_by_name?: string | null;
  created_at?: string;
  products?: { name?: string } | null;
};
type CustomerRequest = {
  id: string;
  request_type?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  quantity?: number | null;
  status?: string;
  note?: string | null;
  inquiry_body?: string | null;
  created_at?: string;
  products?: { name?: string } | null;
};
type StoreMessage = {
  id: string;
  body: string;
  author_name?: string | null;
  created_at?: string;
};
type StoreNotification = {
  id: string;
  title: string;
  body?: string | null;
  href?: string | null;
  kind?: string;
  is_read?: boolean;
  actor_name?: string | null;
  created_at?: string;
};
type ActivityItem = {
  id: string;
  at: string;
  label: string;
  href?: string;
};

function SectionCard({
  id,
  title,
  children,
  action,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-[#E7EAF0] bg-white p-4 shadow-[0_4px_14px_rgba(21,62,115,0.05)] md:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-[#153E73]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function PendingPill({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition",
        value > 0
          ? "border-[#FFE149] bg-[#FFFBEA] text-[#153E73]"
          : "border-[#E8EBF0] bg-white text-[#687386]"
      )}
    >
      <span className="font-medium">{label}</span>
      <span className="rounded-full bg-white px-2 py-0.5 text-sm font-bold text-[#153E73]">
        {value}
      </span>
    </Link>
  );
}

function formatTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminStoreHomePage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [customerRequests, setCustomerRequests] = useState<CustomerRequest[]>([]);
  const [messages, setMessages] = useState<StoreMessage[]>([]);
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [tomorrowChecklist, setTomorrowChecklist] = useState<ChecklistItem[]>([]);
  const [staffName, setStaffName] = useState("店長");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [msgBusy, setMsgBusy] = useState(false);
  const [tomorrowDraft, setTomorrowDraft] = useState("");
  const [tmrBusy, setTmrBusy] = useState(false);
  const [calendarTab, setCalendarTab] = useState<WorkTabId>("todos");
  const [calendarDate, setCalendarDate] = useState<string | undefined>();

  const greeting = useMemo(() => greetingForHour(), []);
  const tomorrowIso = useMemo(() => shiftDate(todayISO(), 1), []);
  const markedReadRef = useRef({ messages: false, notifications: false });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/summary");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setMetrics(data.metrics);
      setTodos(data.todos ?? []);
      setRequests(data.requests ?? []);
      setCustomerRequests(data.customerRequests ?? []);
      setMessages(data.messages ?? []);
      setNotifications(data.notifications ?? []);
      setActivity(data.activity ?? []);
      setTomorrowChecklist(data.tomorrowChecklist ?? []);
      setStaffName(data.staffName || "店長");
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "worklogs" || tab === "messages" || tab === "todos") {
      setCalendarTab(tab);
    }
    const date = params.get("date");
    if (date === "tomorrow") {
      setCalendarDate(shiftDate(todayISO(), 1));
      setCalendarTab("todos");
    } else if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setCalendarDate(date);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || loading) return;
    const hash = window.location.hash;
    if (
      hash === "#requests" ||
      hash === "#messages" ||
      hash === "#calendar" ||
      hash === "#checklist" ||
      hash === "#notifications"
    ) {
      document
        .getElementById(hash === "#checklist" ? "calendar" : hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth" });
    }
    if (hash === "#messages" && !markedReadRef.current.messages) {
      markedReadRef.current.messages = true;
      void fetch("/api/admin/store/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_messages_read" }),
      }).then(() => void load());
    }
    if (hash === "#notifications" && !markedReadRef.current.notifications) {
      markedReadRef.current.notifications = true;
      void fetch("/api/admin/store/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      }).then(() => void load());
    }
  }, [loading, calendarTab, calendarDate, load]);

  const markNotificationsRead = async () => {
    await fetch("/api/admin/store/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    void load();
  };

  const toggleTomorrowItem = async (item: ChecklistItem) => {
    const nextDone = !item.is_done;
    setTomorrowChecklist((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, is_done: nextDone } : t))
    );
    try {
      const res = await fetch("/api/admin/store/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_done: nextDone }),
      });
      if (!res.ok) throw new Error("更新失敗");
    } catch {
      setTomorrowChecklist((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, is_done: item.is_done } : t))
      );
    }
  };

  const addTomorrowItem = async () => {
    const label = tomorrowDraft.trim();
    if (!label) return;
    setTmrBusy(true);
    try {
      const res = await fetch("/api/admin/store/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, todo_date: tomorrowIso }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "新增失敗");
      setTomorrowDraft("");
      setTomorrowChecklist((prev) => [...prev, data.item]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "新增明日待辦失敗");
    } finally {
      setTmrBusy(false);
    }
  };

  const reviewRequest = async (id: string, status: "approved" | "rejected") => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      const res = await fetch("/api/admin/store/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("更新失敗");
      void load();
    } catch {
      void load();
    }
  };

  const sendMessage = async () => {
    const text = messageDraft.trim();
    if (!text) return;
    setMsgBusy(true);
    try {
      const res = await fetch("/api/admin/store/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送出失敗");
      setMessageDraft("");
      setMessages((prev) => [...prev, data.item]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "留言失敗");
    } finally {
      setMsgBusy(false);
    }
  };

  const pendingItems = [
    {
      label: "客戶訂購",
      value: metrics?.pendingCustomerOrders ?? 0,
      href: "/admin/store/pos?type=order",
    },
    {
      label: "價格詢問",
      value: metrics?.pendingPriceInquiries ?? 0,
      href: "/admin/store/pos?type=price_inquiry",
    },
    {
      label: "分店需求",
      value: metrics?.pendingRequests ?? 0,
      href: "/admin/store/demand?type=restock",
    },
    {
      label: "商品異常",
      value: metrics?.openIssues ?? 0,
      href: "/admin/store/issues",
    },
    {
      label: "即期商品",
      value: metrics?.expiring7 ?? 0,
      href: "/admin/store/expiry?range=7",
    },
    {
      label: "未讀留言",
      value: metrics?.unreadMessages ?? 0,
      href: "/admin/store#messages",
    },
    {
      label: "跨店通知",
      value: metrics?.unreadNotifications ?? 0,
      href: "/admin/store#notifications",
    },
  ];

  const pendingFeed = [
    ...customerRequests.map((item) => ({
      id: `csr-${item.id}`,
      title: `${requestTypeLabel(item.request_type ?? "order")} · ${item.customer_name || "客戶"}`,
      detail:
        item.products?.name ||
        item.inquiry_body ||
        item.note ||
        (item.quantity != null ? `數量 ${item.quantity}` : "待處理"),
      href: "/admin/store/pos",
      time: item.created_at,
    })),
    ...requests
      .filter((r) => (r.status ?? "pending") === "pending")
      .map((item) => ({
        id: `req-${item.id}`,
        title: item.products?.name || item.product_label || "分店需求",
        detail: `數量 ${item.quantity ?? 1}${item.note ? ` · ${item.note}` : ""}`,
        href: "/admin/store/demand",
        time: item.created_at,
        requestId: item.id,
        canReview: true,
      })),
  ].slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="rounded-2xl border border-[#FFE149]/60 bg-[#FFFBEA] p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xl font-bold text-[#153E73] md:text-2xl">
              {greeting} {staffName}
            </p>
            <p className="mt-1 text-sm text-[#153E73]/70">門市協作中心 · 先處理今日待確認事項</p>
          </div>
          <Link
            href="/admin/store/pos"
            className="inline-flex min-h-10 items-center rounded-full border border-[#FFE149] bg-[#FFE149] px-4 text-sm font-bold text-[#153E73]"
          >
            開啟客戶服務
          </Link>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-[#153E73]">今日待確認</p>
          <div className="flex flex-wrap gap-2">
            {pendingItems.map((item) => (
              <PendingPill
                key={item.label}
                label={item.label}
                value={loading ? 0 : item.value}
                href={item.href}
              />
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <SectionCard title="快速建立">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STORE_QUICK_ACTIONS.map((action) => {
            const Icon =
              action.icon === "pos"
                ? ShoppingCart
                : action.icon === "orders"
                  ? MessageSquare
                  : action.icon === "pickup"
                    ? MessageSquare
                    : action.icon === "issue"
                      ? AlertTriangle
                      : action.icon === "disposal"
                        ? Trash2
                        : action.icon === "repair"
                          ? Wrench
                          : action.icon === "stock"
                            ? ClipboardList
                            : Package;
            return (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className="flex min-h-[88px] flex-col items-start justify-between rounded-2xl border border-[#E8EBF0] bg-[#FFFEFA] p-3 transition hover:border-[#FFE149] hover:bg-[#FFFBEA]"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF5CC] text-[#153E73]">
                  <Plus className="h-4 w-4" aria-hidden />
                </span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#153E73]">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          id="requests"
          title="待確認事項"
          action={
            <Link href="/admin/store/demand" className="text-xs font-semibold text-[#153E73] underline">
              查看全部
            </Link>
          }
        >
          {loading ? (
            <p className="text-sm text-[#687386]">載入中…</p>
          ) : pendingFeed.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-6 text-center text-sm text-[#687386]">
              目前沒有待確認事項
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingFeed.map((item) => (
                <li key={item.id} className="rounded-xl border border-[#E8EBF0] px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link href={item.href} className="font-semibold text-[#153E73] hover:underline">
                        {item.title}
                      </Link>
                      <p className="mt-0.5 line-clamp-2 text-sm text-[#687386]">{item.detail}</p>
                      <p className="mt-1 text-[11px] text-[#8A94A6]">{formatTime(item.time)}</p>
                    </div>
                    {"canReview" in item && item.canReview && "requestId" in item ? (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800"
                          onClick={() => void reviewRequest(String(item.requestId), "approved")}
                        >
                          可供應
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"
                          onClick={() => void reviewRequest(String(item.requestId), "rejected")}
                        >
                          無法供應
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="分店協作動態">
          {loading ? (
            <p className="text-sm text-[#687386]">載入中…</p>
          ) : activity.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-6 text-center text-sm text-[#687386]">
              今天尚無協作動態
            </p>
          ) : (
            <ul className="space-y-2">
              {activity.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href || "/admin/store"}
                    className="flex items-start gap-3 rounded-xl border border-[#E8EBF0] px-3 py-2.5 transition hover:border-[#FFE149] hover:bg-[#FFFBEA]"
                  >
                    <span className="mt-0.5 shrink-0 text-[12px] font-semibold text-[#8A94A6]">
                      {formatTime(item.at) || "--:--"}
                    </span>
                    <span className="text-sm font-medium text-[#153E73]">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="分店庫存快速查詢">
          <StoreStockLookup compact />
        </SectionCard>

        <SectionCard
          title="明日待辦"
          action={
            <Link
              href="/admin/store?tab=todos&date=tomorrow#calendar"
              className="text-xs font-semibold text-[#153E73] underline"
            >
              完整編輯
            </Link>
          }
        >
          {tomorrowChecklist.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-4 text-center text-sm text-[#687386]">
              明日尚無待辦，可在下方新增。
            </p>
          ) : (
            <ul className="space-y-2">
              {tomorrowChecklist.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 rounded-xl border border-[#E8EBF0] px-3 py-2.5"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(item.is_done)}
                    onChange={() => void toggleTomorrowItem(item)}
                    className="mt-0.5 h-4 w-4 accent-[#FFE149]"
                    aria-label={`完成 ${item.label}`}
                  />
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={cn(
                        "text-sm font-medium text-[#153E73] hover:underline",
                        item.is_done && "text-muted-foreground line-through"
                      )}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-medium text-[#153E73]",
                        item.is_done && "text-muted-foreground line-through"
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <input
              className="h-10 min-w-0 flex-1 rounded-xl border border-[#E7EAF0] px-3 text-sm"
              placeholder="新增明日待辦…"
              value={tomorrowDraft}
              onChange={(e) => setTomorrowDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addTomorrowItem();
                }
              }}
            />
            <button
              type="button"
              disabled={tmrBusy || !tomorrowDraft.trim()}
              className="shrink-0 rounded-xl border border-[#FFE149] bg-[#FFE149] px-3 text-sm font-bold text-[#153E73]"
              onClick={() => void addTomorrowItem()}
            >
              新增
            </button>
          </div>
          {todos.length > 0 ? (
            <div className="mt-4 border-t border-[#E8EBF0] pt-3">
              <p className="mb-2 text-[11px] font-bold tracking-wide text-[#153E73]/50">系統提醒</p>
              <ul className="space-y-1.5">
                {todos.slice(0, 4).map((todo) => (
                  <li key={todo.label}>
                    <Link
                      href={todo.href}
                      className="flex justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-[#FFFBEA]"
                    >
                      <span className="text-[#153E73]">{todo.label}</span>
                      <span className="font-semibold text-[#153E73]/70">{todo.count ?? "→"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard
        id="notifications"
        title="跨店通知"
        action={
          <button
            type="button"
            className="text-xs font-semibold text-[#153E73] underline"
            onClick={() => void markNotificationsRead()}
          >
            全部標為已讀
          </button>
        }
      >
        {loading ? (
          <p className="text-sm text-[#687386]">載入中…</p>
        ) : notifications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-6 text-center text-sm text-[#687386]">
            尚無跨店通知。分店對你提出需求、或對方回覆你的需求時會出現在這裡。
          </p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href || "/admin/store/demand"}
                  className={cn(
                    "block rounded-xl border px-3 py-2.5 transition hover:border-[#FFE149] hover:bg-[#FFFBEA]",
                    n.is_read === false
                      ? "border-[#FFE149] bg-[#FFFBEA]"
                      : "border-[#E8EBF0] bg-white"
                  )}
                  onClick={() => {
                    void fetch("/api/admin/store/notifications", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "mark_read", id: n.id }),
                    });
                  }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-bold text-[#153E73]">{n.title}</p>
                    <p className="shrink-0 text-[11px] text-[#8A94A6]">
                      {formatTime(n.created_at)}
                    </p>
                  </div>
                  {n.body ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-[#687386]">{n.body}</p>
                  ) : null}
                  {n.actor_name ? (
                    <p className="mt-1 text-[11px] text-[#8A94A6]">來自 {n.actor_name}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        id="messages"
        title="交班留言"
        action={
          <Link
            href="/admin/store?tab=messages#calendar"
            className="text-xs font-semibold text-[#153E73] underline"
          >
            依日期查看
          </Link>
        }
      >
        <div
          className="max-h-64 space-y-2 overflow-y-auto rounded-xl bg-[#F7F8FA] p-3"
          onFocus={() => {
            void fetch("/api/admin/store/notifications", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "mark_messages_read" }),
            });
          }}
        >
          {messages.length === 0 ? (
            <p className="text-sm text-[#687386]">今天還沒有交班留言。</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="rounded-xl border border-white bg-white px-3 py-2 shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-[#153E73]">{message.author_name || "門市"}</p>
                  <p className="text-[11px] text-[#8A94A6]">{formatTime(message.created_at)}</p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[#153E73]/90">{message.body}</p>
              </div>
            ))
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="h-11 min-w-0 flex-1 rounded-xl border border-[#E7EAF0] px-3 text-sm"
            placeholder="快速交班留言…"
            value={messageDraft}
            onChange={(e) => setMessageDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void sendMessage();
              }
            }}
          />
          <button
            type="button"
            disabled={msgBusy}
            className="shrink-0 rounded-xl border border-[#FFE149] bg-[#FFE149] px-4 text-sm font-bold text-[#153E73]"
            onClick={() => void sendMessage()}
          >
            送出
          </button>
        </div>
      </SectionCard>

      <SectionCard id="calendar" title="工作紀錄與待辦">
        <StoreTodoCalendar initialTab={calendarTab} initialDate={calendarDate} />
      </SectionCard>
    </div>
  );
}
