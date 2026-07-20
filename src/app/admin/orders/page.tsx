"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import { orderStatusVariant } from "@/lib/admin/status";
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
  SHIPMENT_METHOD_LABELS,
} from "@/lib/utils";
import type { Order, OrderStatus, Shipment } from "@/lib/types/database";

const STATUS_OPTIONS: OrderStatus[] = [
  "awaiting_payment",
  "payment_reported",
  "payment_confirmed",
  "preparing",
  "ready_for_pickup",
  "completed",
  "cancelled",
];

type AdminOrderRow = Order & {
  profiles?: {
    full_name?: string;
    email?: string;
    phone?: string;
    member_number?: string;
    member_code?: string;
  } | null;
  shipments?: Shipment[];
  order_items?: Array<{ product_name: string; quantity: number }>;
};

function orderTypeLabel(o: AdminOrderRow): "團購" | "商城" {
  if (o.group_buy_event_id || o.channel === "group_buy") return "團購";
  return "商城";
}

export default function AdminOrdersPage() {
  const { items, search, setSearch, page, setPage, refresh, loading, error } =
    useAdminList<AdminOrderRow>("/api/admin/orders", "orders", [
      "order_number",
      "customer_phone",
      "customer_name",
    ]);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return items.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (typeFilter === "group_buy" && !(o.group_buy_event_id || o.channel === "group_buy")) {
        return false;
      }
      if (typeFilter === "mall" && (o.group_buy_event_id || o.channel === "group_buy")) {
        return false;
      }
      if (methodFilter) {
        const methods = (o.shipments ?? []).map((s) => s.method);
        if (!methods.includes(methodFilter as Shipment["method"])) return false;
      }
      if (dateFrom && o.created_at < `${dateFrom}T00:00:00`) return false;
      if (dateTo && o.created_at > `${dateTo}T23:59:59`) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const p = o.profiles;
        const hit =
          String(o.order_number ?? "").toLowerCase().includes(q) ||
          String(o.customer_phone ?? "").includes(search) ||
          String(o.customer_name ?? "").toLowerCase().includes(q) ||
          String(p?.full_name ?? "").toLowerCase().includes(q) ||
          String(p?.email ?? "").toLowerCase().includes(q) ||
          String(p?.phone ?? "").includes(search) ||
          String(p?.member_number ?? "").toLowerCase().includes(q) ||
          String(p?.member_code ?? "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [items, statusFilter, typeFilter, methodFilter, dateFrom, dateTo, search]);

  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const updateStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "更新失敗");
      return;
    }
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="App 訂單"
        description="此區僅管理透過 CHIMEIDIY App 建立的訂單。不包含門市 POS、現場刷卡或現金交易。"
        actions={
          <a
            href="/api/admin/orders/export?format=xlsx"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
          >
            匯出 Excel
          </a>
        }
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        App 訂單來源：商城、團購、App 宅配、App 門市取貨。系統未串接 POS，不會顯示門市現場消費紀錄。
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => refresh()}>
            重試
          </button>
        </div>
      )}

      <AdminTable
        columns={[
          {
            key: "order_number",
            header: "訂單編號",
            render: (o) => (
              <Link href={`/admin/orders/${o.id}`} className="font-mono text-primary hover:underline">
                {o.order_number}
              </Link>
            ),
          },
          {
            key: "type",
            header: "類型",
            render: (o) => {
              const t = orderTypeLabel(o);
              return (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    t === "團購" ? "bg-orange-100 text-orange-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {t}
                </span>
              );
            },
          },
          {
            key: "member",
            header: "App 會員",
            render: (o) => {
              const p = o.profiles;
              return (
                <div className="text-sm">
                  <p>{p?.full_name ?? o.customer_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{p?.phone ?? o.customer_phone ?? ""}</p>
                </div>
              );
            },
          },
          {
            key: "fulfillment",
            header: "履約",
            render: (o) => {
              const method = o.shipments?.[0]?.method;
              return method ? SHIPMENT_METHOD_LABELS[method] ?? method : "—";
            },
          },
          { key: "amount", header: "金額", render: (o) => formatCurrency(o.total_amount) },
          {
            key: "status",
            header: "狀態",
            render: (o) => (
              <StatusBadge
                label={ORDER_STATUS_LABELS[o.status] ?? o.status}
                variant={orderStatusVariant(o.status)}
              />
            ),
          },
          {
            key: "time",
            header: "建立時間",
            render: (o) => <span className="text-xs">{formatDate(o.created_at)}</span>,
          },
          {
            key: "actions",
            header: "操作",
            render: (o) => (
              <div className="flex flex-wrap items-center gap-1">
                <Link href={`/admin/orders/${o.id}`}>
                  <Button size="sm" variant="secondary">
                    詳細
                  </Button>
                </Link>
                <select
                  className="rounded border border-border px-2 py-1 text-xs"
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                  aria-label="修改訂單狀態"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            ),
          },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋訂單編號、會員、電話…"
        loading={loading}
        page={page}
        totalPages={pages}
        onPageChange={setPage}
        emptyText="尚無 App 訂單"
        toolbar={
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-lg border border-border px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">全部狀態</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-border px-3 py-2 text-sm"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">全部類型</option>
              <option value="mall">商城</option>
              <option value="group_buy">團購</option>
            </select>
            <select
              className="rounded-lg border border-border px-3 py-2 text-sm"
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">全部履約方式</option>
              <option value="store_pickup">門市取貨</option>
              <option value="home_delivery">宅配</option>
              <option value="cvs_pickup">超商取貨</option>
            </select>
            <input
              type="date"
              className="rounded-lg border border-border px-3 py-2 text-sm"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              aria-label="起始日期"
            />
            <input
              type="date"
              className="rounded-lg border border-border px-3 py-2 text-sm"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              aria-label="結束日期"
            />
          </div>
        }
      />
    </div>
  );
}
