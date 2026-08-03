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
type ChecklistItem = { id: string; label: string; href: string };

const CHECKLIST_STORAGE = "chimeidiy-store-checklist";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadChecked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(`${CHECKLIST_STORAGE}:${todayKey()}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

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
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [staffName, setStaffName] = useState("店長");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());

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
      setChecklist(data.checklist ?? []);
      setStaffName(data.staffName || "店長");
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    setChecked(loadChecked());
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#quick-entry") {
      setEntryOpen(true);
      document.getElementById("quick-entry")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading]);

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(
          `${CHECKLIST_STORAGE}:${todayKey()}`,
          JSON.stringify(Array.from(next))
        );
      } catch {
        /* ignore */
      }
      return next;
    });
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
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-[#FFE149] bg-[#FFE149] px-3 py-1.5 text-sm font-bold text-[#153E73]"
            onClick={() => setEntryOpen((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            新增紀錄
          </button>
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
          <p className="text-sm text-muted-foreground">
            點「新增紀錄」選擇異常、報廢、退貨、報修等（約 30 秒完成）。
          </p>
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

      {/* 4. Inventory */}
      <SectionCard title="庫存中心">
        <div className="flex flex-wrap gap-2">
          <StatPill
            label="缺貨"
            value={metrics?.outOfStock ?? 0}
            href="/admin/store/inventory"
            tone={(metrics?.outOfStock ?? 0) > 0 ? "danger" : "default"}
          />
          <StatPill
            label="低庫存"
            value={metrics?.lowStock ?? 0}
            href="/admin/store/inventory"
            tone={(metrics?.lowStock ?? 0) > 0 ? "warn" : "default"}
          />
          <StatPill
            label="待叫貨"
            value={metrics?.pendingRestock ?? 0}
            href="/admin/store/inventory"
          />
          <StatPill
            label="今日進貨"
            value={metrics?.todayReceive ?? 0}
            href="/admin/store/batches"
            tone="ok"
          />
        </div>
      </SectionCard>

      {/* 5. Branch requests placeholder */}
      <SectionCard title="分店需求">
        <p className="rounded-[12px] border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-4 text-sm text-muted-foreground">
          Phase C 將加入叫貨需求（同意／退回）。目前請用「目前庫存」與批次進貨處理補貨。
        </p>
        <Link
          href="/admin/store/inventory"
          className="mt-3 inline-block text-sm font-semibold text-[#153E73] underline"
        >
          前往庫存 →
        </Link>
      </SectionCard>

      {/* 6. Messages placeholder */}
      <SectionCard id="messages" title="今日留言">
        <p className="rounded-[12px] border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-4 text-sm text-muted-foreground">
          Phase C 將加入店內留言串。目前緊急事項請用「商品異常」登記。
        </p>
      </SectionCard>

      {/* 7. Checklist */}
      <SectionCard id="checklist" title="明日／今日待辦">
        {checklist.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無待辦清單</p>
        ) : (
          <ul className="space-y-2">
            {checklist.map((item) => {
              const done = checked.has(item.id);
              return (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-[#E8EBF0] px-3 py-2.5 hover:bg-[#FFFBEA]">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleCheck(item.id)}
                      className="h-4 w-4 accent-[#FFE149]"
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm font-medium text-[#153E73]",
                        done && "text-muted-foreground line-through"
                      )}
                    >
                      {item.label}
                    </span>
                    <Link
                      href={item.href}
                      className="text-xs font-semibold text-[#153E73]/60 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      前往
                    </Link>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
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
              a.icon === "orders"
                ? ShoppingCart
                : a.icon === "pickup"
                  ? Package
                  : a.icon === "issue"
                    ? AlertTriangle
                    : a.icon === "disposal"
                      ? Trash2
                      : a.icon === "repair"
                        ? Wrench
                        : a.icon === "log"
                          ? ClipboardList
                          : a.icon === "return"
                            ? Package
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
