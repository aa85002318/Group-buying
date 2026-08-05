"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  STORE_QUICK_ENTRY_TYPES,
  greetingForHour,
} from "@/lib/admin/store-ops";
import { STORE_REQUEST_STATUS_LABEL } from "@/lib/admin/store-entry";
import { StoreTodoCalendar } from "@/components/admin/store/StoreTodoCalendar";
import { cn } from "@/lib/utils";

type Metrics = {
  productCount: number;
  batchCount: number;
  expiringToday: number;
  expiring7: number;
  expiring30: number;
  expiredOpen: number;
  disposalMonthLoss: number;
  openIssues: number;
  openReturns: number;
  lowStock: number;
  outOfStock: number;
  pendingRestock: number;
  todayReceive: number;
  lastBackupAt: string | null;
  pendingRequests?: number;
};

type OrdersToday = {
  new: number;
  paid: number;
  readyPickup: number;
  completed: number;
  cancelled: number;
  total: number;
};

type Todo = { priority: number; label: string; href: string; count?: number };
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
type StoreMessage = {
  id: string;
  body: string;
  author_name?: string | null;
  created_at?: string;
};

function StatPill({
  label,
  value,
  href,
  tone = "default",
}: {
  label: string;
  value: number;
  href: string;
  tone?: "default" | "ok" | "warn" | "danger" | "info";
}) {
  const tones = {
    default: "border-[#E8EBF0] bg-white",
    ok: "border-emerald-200 bg-emerald-50",
    warn: "border-amber-200 bg-amber-50",
    danger: "border-red-200 bg-red-50",
    info: "border-sky-200 bg-sky-50",
  };
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-[7.5rem] flex-1 flex-col rounded-[14px] border px-4 py-3 transition hover:shadow-sm",
        tones[tone]
      )}
    >
      <span className="text-[12px] font-medium text-[#153E73]/70">{label}</span>
      <span className="mt-1 text-2xl font-bold text-[#153E73]">{value}</span>
    </Link>
  );
}

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
      className="scroll-mt-20 rounded-[14px] border border-[#E7EAF0] bg-white p-4 shadow-[0_4px_14px_rgba(21,62,115,0.05)]"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-[#153E73]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function AdminStoreHomePage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [ordersToday, setOrdersToday] = useState<OrdersToday | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [messages, setMessages] = useState<StoreMessage[]>([]);
  const [staffName, setStaffName] = useState("店長");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [msgBusy, setMsgBusy] = useState(false);

  const greeting = useMemo(() => greetingForHour(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/summary");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setMetrics(data.metrics);
      setOrdersToday(data.ordersToday ?? null);
      setTodos(data.todos ?? []);
      setRequests(data.requests ?? []);
      setMessages(data.messages ?? []);
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
    const hash = window.location.hash;
    if (hash === "#quick-entry") {
      setEntryOpen(true);
      document.getElementById("quick-entry")?.scrollIntoView({ behavior: "smooth" });
    } else if (hash === "#requests" || hash === "#messages" || hash === "#calendar" || hash === "#checklist") {
      document.getElementById(hash === "#checklist" ? "calendar" : hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading]);

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

  const attention = [
    {
      label: "新訂單",
      value: ordersToday?.new ?? 0,
      href: "/admin/orders?status=awaiting_payment",
      tone: "ok" as const,
      dot: "bg-emerald-500",
    },
    {
      label: "待取貨",
      value: ordersToday?.readyPickup ?? 0,
      href: "/admin/orders?status=ready_for_pickup",
      tone: "warn" as const,
      dot: "bg-amber-500",
    },
    {
      label: "商品異常",
      value: metrics?.openIssues ?? 0,
      href: "/admin/store/issues?status=open",
      tone: "danger" as const,
      dot: "bg-red-500",
    },
    {
      label: "即期商品",
      value: metrics?.expiring7 ?? 0,
      href: "/admin/store/expiry?range=7",
      tone: "info" as const,
      dot: "bg-yellow-400",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Greeting + today attention */}
      <section className="rounded-[14px] border border-[#FFE149]/50 bg-[#FFFBEA] p-4 md:p-5">
        <p className="text-xl font-bold text-[#153E73] md:text-2xl">
          {greeting} {staffName}
        </p>
        <p className="mt-1 text-sm text-[#153E73]/70">今日待完成 · 同一套商品主檔與 App 訂單</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {attention.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex items-center gap-2 rounded-[12px] border border-white/80 bg-white px-3 py-2.5 shadow-sm"
            >
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", a.dot)} />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] text-[#153E73]/70">{a.label}</span>
                <span className="text-lg font-bold text-[#153E73]">{loading ? "—" : a.value}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {/* 1. App orders today */}
      <SectionCard
        title="今天訂單"
        action={
          <Link href="/admin/orders" className="text-xs font-semibold text-[#153E73] underline">
            全部訂單
          </Link>
        }
      >
        <div className="flex flex-wrap gap-2">
          <StatPill
            label="新訂單"
            value={ordersToday?.new ?? 0}
            href="/admin/orders?status=awaiting_payment"
            tone={(ordersToday?.new ?? 0) > 0 ? "ok" : "default"}
          />
          <StatPill
            label="已付款"
            value={ordersToday?.paid ?? 0}
            href="/admin/orders?status=payment_confirmed"
          />
          <StatPill
            label="待取貨"
            value={ordersToday?.readyPickup ?? 0}
            href="/admin/orders?status=ready_for_pickup"
            tone={(ordersToday?.readyPickup ?? 0) > 0 ? "warn" : "default"}
          />
          <StatPill
            label="已完成"
            value={ordersToday?.completed ?? 0}
            href="/admin/orders?status=completed"
          />
          <StatPill
            label="已取消"
            value={ordersToday?.cancelled ?? 0}
            href="/admin/orders?status=cancelled"
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          今日新建 {ordersToday?.total ?? 0} 筆 · 待取貨含尚未領取的開放訂單
        </p>
      </SectionCard>

      {/* 2. Quick field entry */}
      <SectionCard
        id="quick-entry"
        title="現場快速輸入"
        action={
          <Link
            href="/admin/store/entry"
            className="inline-flex items-center gap-1 rounded-lg border border-[#FFE149] bg-[#FFE149] px-3 py-1.5 text-sm font-bold text-[#153E73]"
          >
            <Plus className="h-4 w-4" />
            新增紀錄
          </Link>
        }
      >
        {entryOpen ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {STORE_QUICK_ENTRY_TYPES.map((t) => (
              <Link
                key={t.id}
                href={t.href}
                className="rounded-[12px] border border-[#E8EBF0] px-3 py-3 text-sm font-semibold text-[#153E73] hover:border-[#FFE149] hover:bg-[#FFFBEA]"
              >
                ○ {t.label}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">
              共用表單：異常／報廢／退貨／報修／留言（約 30 秒）。
            </p>
            <button
              type="button"
              className="text-sm font-semibold text-[#153E73] underline"
              onClick={() => setEntryOpen(true)}
            >
              展開類型
            </button>
          </div>
        )}
      </SectionCard>

      {/* 3. Expiry */}
      <SectionCard title="效期中心">
        <div className="flex flex-wrap gap-2">
          <StatPill
            label="今天到期"
            value={metrics?.expiringToday ?? 0}
            href="/admin/store/expiry?range=0"
            tone={(metrics?.expiringToday ?? 0) > 0 ? "danger" : "default"}
          />
          <StatPill
            label="七天內"
            value={metrics?.expiring7 ?? 0}
            href="/admin/store/expiry?range=7"
            tone={(metrics?.expiring7 ?? 0) > 0 ? "warn" : "default"}
          />
          <StatPill
            label="30 天內"
            value={metrics?.expiring30 ?? 0}
            href="/admin/store/expiry?range=30"
          />
          <StatPill
            label="已過期"
            value={metrics?.expiredOpen ?? 0}
            href="/admin/store/expiry?range=expired"
            tone={(metrics?.expiredOpen ?? 0) > 0 ? "danger" : "default"}
          />
        </div>
      </SectionCard>

      {/* 4. Demand / out of stock */}
      <SectionCard
        id="requests"
        title="分店商品需求／缺貨通知"
        action={
          <Link
            href="/admin/store/demand"
            className="text-xs font-semibold text-[#153E73] underline"
          >
            開啟完整頁面
          </Link>
        }
      >
        <div className="mb-3 flex flex-wrap gap-2">
          <Link
            href="/admin/store/demand?type=out_of_stock"
            className="rounded-xl border border-[#E8EBF0] bg-[#FFFBEA] px-3 py-2 text-sm font-bold text-[#153E73]"
          >
            ＋商品缺貨
          </Link>
          <Link
            href="/admin/store/demand?type=restock"
            className="rounded-xl border border-[#FFE149] bg-[#FFE149] px-3 py-2 text-sm font-bold text-[#153E73]"
          >
            ＋門市叫貨需求
          </Link>
        </div>
        {requests.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-4 text-sm text-muted-foreground">
            尚無待處理缺貨／叫貨。
          </p>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => {
              const name =
                r.products?.name || r.product_label || "未指定商品";
              const status = r.status ?? "pending";
              return (
                <li
                  key={r.id}
                  className="rounded-[12px] border border-[#E8EBF0] px-3 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#153E73]">{name}</p>
                      <p className="mt-0.5 text-sm text-[#153E73]/80">
                        數量 {r.quantity ?? 1}
                        {r.note ? ` · ${r.note}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {r.requested_by_name || "門市"} ·{" "}
                        {STORE_REQUEST_STATUS_LABEL[status] ?? status}
                      </p>
                    </div>
                    {status === "pending" ? (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800"
                          onClick={() => void reviewRequest(r.id, "approved")}
                        >
                          同意
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"
                          onClick={() => void reviewRequest(r.id, "rejected")}
                        >
                          退回
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {/* 6. Messages */}
      <SectionCard
        id="messages"
        title="今日留言"
        action={
          <Link
            href="/admin/store/entry?type=message"
            className="text-xs font-semibold text-[#153E73] underline"
          >
            完整輸入
          </Link>
        }
      >
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-[12px] bg-[#F7F8FA] p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">今天還沒有留言。</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-xl border border-white bg-white px-3 py-2 shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-[#153E73]">
                    {m.author_name || "門市"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.created_at
                      ? new Date(m.created_at).toLocaleTimeString("zh-TW", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[#153E73]/90">{m.body}</p>
              </div>
            ))
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="h-10 min-w-0 flex-1 rounded-xl border border-[#E7EAF0] px-3 text-sm"
            placeholder="快速留言…"
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
            className="shrink-0 rounded-xl border border-[#FFE149] bg-[#FFE149] px-3 text-sm font-bold text-[#153E73]"
            onClick={() => void sendMessage()}
          >
            送出
          </button>
        </div>
      </SectionCard>

      {/* 7. Store calendar */}
      <SectionCard id="calendar" title="門市行事曆">
        <StoreTodoCalendar />
        {todos.length > 0 ? (
          <div className="mt-4 border-t border-[#E8EBF0] pt-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#153E73]/50">
              系統提醒
            </p>
            <ul className="space-y-1.5">
              {todos.slice(0, 5).map((t) => (
                <li key={t.label}>
                  <Link
                    href={t.href}
                    className="flex justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-[#FFFBEA]"
                  >
                    <span className="text-[#153E73]">{t.label}</span>
                    <span className="font-semibold text-[#153E73]/70">{t.count ?? "→"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </SectionCard>

      {/* 8. Quick actions */}
      <SectionCard title="快速操作">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STORE_QUICK_ACTIONS.map((a) => {
            const Icon =
              a.icon === "pos"
                ? MessageSquare
                : a.icon === "orders"
                  ? ShoppingCart
                  : a.icon === "pickup"
                    ? Package
                    : a.icon === "issue"
                      ? AlertTriangle
                      : a.icon === "disposal"
                        ? Trash2
                        : a.icon === "repair"
                          ? Wrench
                          : a.icon === "stock"
                            ? ClipboardList
                            : MessageSquare;
            return (
              <Link
                key={a.href + a.label}
                href={a.href}
                className="flex flex-col items-center gap-2 rounded-[14px] border border-[#E8EBF0] bg-[#FFFEFA] px-3 py-4 text-center hover:border-[#FFE149] hover:bg-[#FFFBEA]"
              >
                <Icon className="h-5 w-5 text-[#153E73]" />
                <span className="text-[13px] font-semibold text-[#153E73]">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
