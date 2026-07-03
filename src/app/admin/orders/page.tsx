"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import { orderStatusVariant } from "@/lib/admin/status";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types/database";

const STATUS_OPTIONS: OrderStatus[] = [
  "awaiting_payment",
  "payment_reported",
  "payment_confirmed",
  "preparing",
  "ready_for_pickup",
  "completed",
  "cancelled",
];

export default function AdminOrdersPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<Order>(
    "/api/admin/orders",
    "orders",
    ["order_number"]
  );
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = statusFilter ? paginated.filter((o) => o.status === statusFilter) : paginated;

  const updateStatus = async (id: string, status: OrderStatus) => {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="訂單管理"
        description="訂單查詢、狀態更新與匯出"
        actions={
          <a
            href="/api/admin/orders/export?format=xlsx"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
          >
            匯出 Excel
          </a>
        }
      />

      <AdminTable
        columns={[
          { key: "order_number", header: "訂單編號", render: (o) => <span className="font-mono">{o.order_number}</span> },
          {
            key: "member",
            header: "會員",
            render: (o) => {
              const p = (o as Order & { profiles?: { full_name?: string } }).profiles;
              return p?.full_name ?? "—";
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
          { key: "time", header: "時間", render: (o) => <span className="text-xs">{formatDate(o.created_at)}</span> },
          {
            key: "actions",
            header: "更新狀態",
            render: (o) => (
              <select
                className="rounded border border-border px-2 py-1 text-xs"
                value={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            ),
          },
        ]}
        rows={filtered}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋訂單編號…"
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        toolbar={
          <select
            className="rounded-lg border border-border px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">全部狀態</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        }
      />
    </div>
  );
}
