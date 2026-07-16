"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import { orderStatusVariant } from "@/lib/admin/status";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import type { Order, OrderItem, OrderStatus } from "@/lib/types/database";

const STATUS_OPTIONS: OrderStatus[] = [
  "awaiting_payment",
  "payment_reported",
  "payment_confirmed",
  "preparing",
  "ready_for_pickup",
  "completed",
  "cancelled",
];

type OrderDetail = Order & {
  profiles?: { full_name?: string; email?: string; phone?: string } | null;
  order_items?: OrderItem[];
  pickup_store?: { name?: string; address?: string; phone?: string } | null;
};

const EMAIL_ACTIONS: Array<{ type: string; label: string }> = [
  { type: "confirmation", label: "訂單確認信件" },
  { type: "unpaid", label: "尚未付款通知" },
  { type: "cancelled", label: "取消訂單" },
  { type: "arrival", label: "到貨通知" },
];

export default function AdminOrdersPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<Order>(
    "/api/admin/orders",
    "orders",
    ["order_number"]
  );
  const [statusFilter, setStatusFilter] = useState("");
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const filtered = statusFilter ? paginated.filter((o) => o.status === statusFilter) : paginated;

  const updateStatus = async (id: string, status: OrderStatus) => {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
    if (detail?.id === id) {
      setDetail({ ...detail, status });
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "載入失敗");
        return;
      }
      setDetail(data.order as OrderDetail);
    } finally {
      setDetailLoading(false);
    }
  };

  const resendEmail = async (type: string) => {
    if (!detail) return;
    setSending(type);
    try {
      const res = await fetch(`/api/admin/orders/${detail.id}/resend-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "寄送失敗");
        return;
      }
      alert("信件已寄出");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="訂單管理"
        description="訂單查詢、產品明細、重發客戶信件與匯出"
        actions={
          <a
            href="/api/admin/orders/export?format=xlsx"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
          >
            匯出 Excel
          </a>
        }
      />

      {(detail || detailLoading) && (
        <div className="space-y-4 rounded-xl border border-primary/20 bg-white p-4 shadow-card">
          {detailLoading || !detail ? (
            <p className="text-sm text-muted-foreground">載入訂單明細…</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-medium text-coffee">訂單 {detail.order_number}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {detail.profiles?.full_name ?? "會員"} · {detail.profiles?.email ?? "無 Email"}
                    {detail.profiles?.phone ? ` · ${detail.profiles.phone}` : ""}
                  </p>
                  <p className="mt-1 text-sm">
                    狀態：{ORDER_STATUS_LABELS[detail.status] ?? detail.status} · 金額{" "}
                    {formatCurrency(detail.total_amount)} · {formatDate(detail.created_at)}
                  </p>
                  {detail.pickup_store?.name && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      取貨：{detail.pickup_store.name}
                      {detail.pickup_store.address ? `（${detail.pickup_store.address}）` : ""}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="secondary" onClick={() => setDetail(null)}>
                  關閉
                </Button>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-coffee">產品資訊</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-3 py-2">商品</th>
                        <th className="px-3 py-2">單價</th>
                        <th className="px-3 py-2">數量</th>
                        <th className="px-3 py-2">小計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.order_items ?? []).map((item) => (
                        <tr key={item.id} className="border-t border-border">
                          <td className="px-3 py-2">{item.product_name}</td>
                          <td className="px-3 py-2">{formatCurrency(item.unit_price)}</td>
                          <td className="px-3 py-2">{item.quantity}</td>
                          <td className="px-3 py-2">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                      {(detail.order_items ?? []).length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-3 text-muted-foreground">
                            無產品明細
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-coffee">重發信件給客戶</p>
                <div className="flex flex-wrap gap-2">
                  {EMAIL_ACTIONS.map((a) => (
                    <Button
                      key={a.type}
                      size="sm"
                      variant="secondary"
                      disabled={sending === a.type}
                      onClick={() => resendEmail(a.type)}
                    >
                      {sending === a.type ? "寄送中…" : a.label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <AdminTable
        columns={[
          {
            key: "order_number",
            header: "訂單編號",
            render: (o) => (
              <button
                type="button"
                className="font-mono text-primary hover:underline"
                onClick={() => openDetail(o.id)}
              >
                {o.order_number}
              </button>
            ),
          },
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
            header: "操作",
            render: (o) => (
              <div className="flex flex-wrap items-center gap-1">
                <Button size="sm" variant="secondary" onClick={() => openDetail(o.id)}>
                  明細
                </Button>
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
              </div>
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
