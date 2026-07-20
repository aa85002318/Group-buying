"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { orderStatusVariant } from "@/lib/admin/status";
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
  ORDER_PAYMENT_STATUS_LABELS,
  PAYMENT_GATEWAY_LABELS,
  SHIPMENT_METHOD_LABELS,
} from "@/lib/utils";
import type {
  Order,
  OrderItem,
  OrderPayment,
  OrderStatus,
  Shipment,
} from "@/lib/types/database";

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
  profiles?: {
    id?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    member_number?: string;
    member_code?: string;
    is_active?: boolean;
  } | null;
  order_items?: OrderItem[];
  pickup_store?: { name?: string; address?: string; phone?: string } | null;
  shipments?: Shipment[];
  payments?: OrderPayment[];
};

type AuditRow = {
  id: string;
  action: string;
  created_at: string;
  old_data?: unknown;
  new_data?: unknown;
};

const EMAIL_ACTIONS: Array<{ type: string; label: string }> = [
  { type: "confirmation", label: "訂單確認信件" },
  { type: "unpaid", label: "尚未付款通知" },
  { type: "cancelled", label: "取消訂單" },
  { type: "arrival", label: "到貨通知" },
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setOrder(data.order as OrderDetail);
      setAdminNotes((data.order as OrderDetail).admin_notes ?? "");
      setAudits(data.audit_logs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const saveNotes = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setOrder(data.order);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (status: OrderStatus) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "更新失敗");
      return;
    }
    await load();
  };

  const resendEmail = async (type: string) => {
    setSending(type);
    try {
      const res = await fetch(`/api/admin/orders/${id}/resend-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "寄送失敗");
        return;
      }
      alert("信件已送出至客戶信箱（可至垃圾郵件匣確認）。");
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{error ?? "找不到訂單"}</p>
        <Button variant="outline" onClick={load}>
          重新載入
        </Button>
        <Link href="/admin/orders" className="ml-2 text-sm text-primary hover:underline">
          返回 App 訂單
        </Link>
      </div>
    );
  }

  const typeLabel =
    order.group_buy_event_id || order.channel === "group_buy" ? "團購" : "商城";
  const shipment = order.shipments?.[0];
  const payment = order.payments?.[0];

  return (
    <div className="space-y-6 print:space-y-3">
      <AdminPageHeader
        title={`App 訂單 ${order.order_number}`}
        description="此區僅管理透過 CHIMEIDIY App 建立的訂單。"
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={() => window.print()}>
              列印
            </Button>
            <Link href="/admin/orders">
              <Button variant="secondary">返回列表</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-white p-4 shadow-card">
          <h2 className="font-medium text-coffee">訂單資訊</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">類型</dt>
              <dd>{typeLabel}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">狀態</dt>
              <dd>
                <StatusBadge
                  label={ORDER_STATUS_LABELS[order.status] ?? order.status}
                  variant={orderStatusVariant(order.status)}
                />
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">建立時間</dt>
              <dd>{formatDate(order.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">總金額</dt>
              <dd className="font-bold">{formatCurrency(order.total_amount)}</dd>
            </div>
            {order.notes && (
              <div>
                <dt className="text-muted-foreground">客戶備註</dt>
                <dd className="mt-1 whitespace-pre-wrap">{order.notes}</dd>
              </div>
            )}
          </dl>
          <div className="mt-4 print:hidden">
            <label className="text-sm text-muted-foreground">修改狀態</label>
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={order.status}
              onChange={(e) => updateStatus(e.target.value as OrderStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-4 shadow-card">
          <h2 className="font-medium text-coffee">App 會員資訊</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">姓名</dt>
              <dd>{order.profiles?.full_name ?? order.customer_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{order.profiles?.email ?? order.customer_email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">電話</dt>
              <dd>{order.profiles?.phone ?? order.customer_phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">App 會員編號</dt>
              <dd className="font-mono">
                {order.profiles?.member_number ?? order.profiles?.member_code ?? "—"}
              </dd>
            </div>
          </dl>
          {order.profiles?.id && (
            <Link
              href={`/admin/members/${order.profiles.id}`}
              className="mt-3 inline-block text-sm text-primary hover:underline print:hidden"
            >
              查看 App 會員
            </Link>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-white p-4 shadow-card">
        <h2 className="mb-3 font-medium text-coffee">商品明細</h2>
        <div className="overflow-x-auto">
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
              {(order.order_items ?? []).map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2">{item.product_name}</td>
                  <td className="px-3 py-2">{formatCurrency(item.unit_price)}</td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
              {(order.order_items ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-muted-foreground">
                    無商品明細
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-1 text-sm">
          <p>小計：{formatCurrency(order.subtotal)}</p>
          <p>運費：{formatCurrency(order.shipping_fee)}</p>
          <p>折扣：{formatCurrency(order.discount)}</p>
          <p className="font-bold">總計：{formatCurrency(order.total_amount)}</p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-white p-4 shadow-card">
          <h2 className="font-medium text-coffee">配送／取貨</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">履約方式</dt>
              <dd>
                {shipment?.method
                  ? SHIPMENT_METHOD_LABELS[shipment.method] ?? shipment.method
                  : "—"}
              </dd>
            </div>
            {order.pickup_store?.name && (
              <div>
                <dt className="text-muted-foreground">取貨門市</dt>
                <dd className="mt-1">
                  {order.pickup_store.name}
                  {order.pickup_store.address ? `（${order.pickup_store.address}）` : ""}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-white p-4 shadow-card">
          <h2 className="font-medium text-coffee">付款資訊</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">付款狀態</dt>
              <dd>
                {order.payment_status
                  ? ORDER_PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">金流</dt>
              <dd>
                {payment?.gateway
                  ? PAYMENT_GATEWAY_LABELS[payment.gateway] ?? payment.gateway
                  : order.payment_method ?? "—"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-white p-4 shadow-card print:hidden">
        <h2 className="font-medium text-coffee">內部備註</h2>
        <textarea
          className="mt-2 min-h-[100px] w-full rounded-lg border border-border p-3 text-sm"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="僅後台可見的內部備註…"
        />
        <Button className="mt-2" onClick={saveNotes} disabled={saving}>
          {saving ? "儲存中…" : "儲存備註"}
        </Button>
      </section>

      <section className="rounded-xl border border-border bg-white p-4 shadow-card print:hidden">
        <h2 className="mb-2 font-medium text-coffee">重發信件</h2>
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
      </section>

      <section className="rounded-xl border border-border bg-white p-4 shadow-card print:hidden">
        <h2 className="mb-2 font-medium text-coffee">操作紀錄</h2>
        {audits.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無操作紀錄</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {audits.map((a) => (
              <li key={a.id} className="rounded-lg bg-muted/40 px-3 py-2">
                <span className="font-medium">{a.action}</span>
                <span className="ml-2 text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
