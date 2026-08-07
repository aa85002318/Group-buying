"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QrCode, Store, PackageCheck, AlertTriangle } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";
import { formatCurrency, ORDER_PICKUP_STATUS_LABELS, ORDER_STATUS_LABELS } from "@/lib/utils";

type StaffOrder = {
  id: string;
  order_number?: string | null;
  status?: string | null;
  pickup_status?: string | null;
  pickup_token?: string | null;
  total_amount?: number | null;
  created_at?: string | null;
  profiles?: { full_name?: string | null; phone?: string | null } | null;
};

function isReadyForCounter(o: StaffOrder) {
  const pickup = o.pickup_status ?? "";
  const status = o.status ?? "";
  if (pickup === "picked_up") return false;
  return (
    pickup === "ready" ||
    pickup === "ready_for_pickup" ||
    status === "ready_for_pickup" ||
    status === "paid" ||
    status === "processing"
  );
}

export default function StaffHomeClient() {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffName, setStaffName] = useState("門市夥伴");
  const [storeName, setStoreName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/staff/me").then(async (r) => (r.ok ? r.json() : null)),
      fetch("/api/staff/orders").then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入訂單失敗");
        return d;
      }),
    ])
      .then(([me, orderData]) => {
        if (cancelled) return;
        if (me?.staff) {
          setStaffName(me.staff.full_name?.trim() || me.staff.email || "門市夥伴");
          setStoreName(me.staff.store?.name ?? null);
        }
        setOrders(Array.isArray(orderData?.orders) ? orderData.orders : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "載入失敗");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const readyOrders = useMemo(
    () => orders.filter(isReadyForCounter).slice(0, 12),
    [orders]
  );

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4 pb-10">
      <div>
        <p className="text-sm font-semibold text-[#687386]">今日作業</p>
        <h1 className="mt-1 text-2xl font-bold text-[#153E73]">
          {staffName}
          {storeName ? ` · ${storeName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-[#687386]">
          App 訂單取貨掃碼，與門市協作中心分開：這裡不處理 POS／收銀／發票。
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <Link
          href={APP_ROUTES.staffPickupScan}
          className="flex min-h-[112px] flex-col justify-between rounded-[20px] bg-[#FFE149] p-4 text-[#153E73] shadow-[0_8px_24px_rgba(21,62,115,.08)]"
        >
          <QrCode className="h-6 w-6" aria-hidden />
          <span className="text-sm font-bold">掃碼取貨</span>
        </Link>
        <Link
          href="/admin/store"
          className="flex min-h-[112px] flex-col justify-between rounded-[20px] bg-white p-4 text-[#153E73] shadow-[0_8px_24px_rgba(21,62,115,.06)] ring-1 ring-[#E6E9EF]"
        >
          <Store className="h-6 w-6" aria-hidden />
          <span className="text-sm font-bold">門市協作中心</span>
        </Link>
        <Link
          href="/admin/pickup"
          className="flex min-h-[96px] flex-col justify-between rounded-[20px] bg-white p-4 text-[#153E73] shadow-[0_8px_24px_rgba(21,62,115,.06)] ring-1 ring-[#E6E9EF]"
        >
          <PackageCheck className="h-5 w-5" aria-hidden />
          <span className="text-sm font-bold">取貨核銷列表</span>
        </Link>
        <Link
          href="/admin/store/entry?type=issue"
          className="flex min-h-[96px] flex-col justify-between rounded-[20px] bg-white p-4 text-[#153E73] shadow-[0_8px_24px_rgba(21,62,115,.06)] ring-1 ring-[#E6E9EF]"
        >
          <AlertTriangle className="h-5 w-5" aria-hidden />
          <span className="text-sm font-bold">商品異常回報</span>
        </Link>
      </section>

      <section className="rounded-[20px] bg-white p-4 shadow-[0_8px_24px_rgba(21,62,115,.06)] ring-1 ring-[#E6E9EF]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#153E73]">待取貨（App 訂單）</h2>
          <Link
            href={APP_ROUTES.staffPickupScan}
            className="text-xs font-semibold text-[#153E73] underline"
          >
            去掃碼
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-[#687386]">載入中…</p>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : readyOrders.length === 0 ? (
          <p className="text-sm text-[#687386]">目前沒有待取貨訂單，可直接掃碼查單。</p>
        ) : (
          <ul className="divide-y divide-[#E6E9EF]">
            {readyOrders.map((o) => {
              const token = o.pickup_token?.trim();
              const href = token
                ? `/staff/pickup/${encodeURIComponent(token)}`
                : APP_ROUTES.staffPickupScan;
              const name = o.profiles?.full_name ?? "會員";
              return (
                <li key={o.id}>
                  <Link href={href} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#153E73]">
                        {o.order_number ?? o.id.slice(0, 8)} · {name}
                      </p>
                      <p className="text-xs text-[#687386]">
                        {ORDER_PICKUP_STATUS_LABELS[
                          (o.pickup_status ?? "") as keyof typeof ORDER_PICKUP_STATUS_LABELS
                        ] ??
                          ORDER_STATUS_LABELS[
                            (o.status ?? "") as keyof typeof ORDER_STATUS_LABELS
                          ] ??
                          o.status ??
                          "—"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-[#153E73]">
                      {formatCurrency(Number(o.total_amount ?? 0))}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
