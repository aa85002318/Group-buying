"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
  ORDER_PAYMENT_STATUS_LABELS,
  PAYMENT_GATEWAY_LABELS,
  SHIPMENT_METHOD_LABELS,
} from "@/lib/utils";
import type { Order, OrderPayment, OrderStatus, Shipment } from "@/lib/types/database";

const FILTER_MAP: Record<string, OrderStatus[] | null> = {
  awaiting: ["awaiting_payment", "payment_reported"],
  pickup: ["payment_confirmed", "preparing", "ready_for_pickup"],
  completed: ["completed"],
};

const FILTER_LABELS: Record<string, string> = {
  awaiting: "待付款",
  pickup: "待取貨",
  completed: "已完成",
};

type OrdersClientProps = {
  /** Hide the page H1 when parent already shows App 訂單標題 */
  hideTitle?: boolean;
  /** Use App 訂單 wording and type tags */
  appOrdersOnly?: boolean;
};

function orderTypeLabel(order: Order): "團購" | "商城" {
  if (order.group_buy_event_id || order.channel === "group_buy") return "團購";
  return "商城";
}

export function OrdersClient({ hideTitle = false, appOrdersOnly = false }: OrdersClientProps) {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/orders/my")
      .then((r) => {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const displayed = useMemo(() => {
    const statuses = filter ? FILTER_MAP[filter] : null;
    if (!statuses) return orders;
    return orders.filter((o) => statuses.includes(o.status));
  }, [orders, filter]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-foreground-secondary">訂單載入失敗，請稍後再試</p>
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={() => window.location.reload()}
        >
          重新載入
        </button>
      </div>
    );
  }

  const titleBase = appOrdersOnly ? "我的 App 訂單" : "我的訂單";

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <div>
          <h1 className="text-xl font-bold text-caramel">
            {titleBase}
            {filter && FILTER_LABELS[filter] ? ` · ${FILTER_LABELS[filter]}` : ""}
          </h1>
          {appOrdersOnly && (
            <p className="mt-1 text-sm text-foreground-secondary">
              僅顯示透過 CHIMEIDIY App 建立的商城與團購訂單，不包含門市現場消費紀錄。
            </p>
          )}
        </div>
      )}

      {filter && hideTitle && FILTER_LABELS[filter] && (
        <p className="text-sm font-medium text-foreground-secondary">篩選：{FILTER_LABELS[filter]}</p>
      )}

      {displayed.length === 0 ? (
        <div className="space-y-3 py-12 text-center">
          <p className="text-foreground-secondary">尚無 App 訂單</p>
          <p className="text-xs text-foreground-secondary">此處不會顯示門市現場消費紀錄</p>
          <Link href="/shop" className="text-sm text-primary hover:underline">
            前往商城選購
          </Link>
        </div>
      ) : (
        displayed.map((order) => {
          const shipment = (order.shipments as Shipment[] | undefined)?.[0];
          const payment = (order.payments as OrderPayment[] | undefined)?.[0];
          const typeLabel = orderTypeLabel(order);
          const summary =
            order.order_items
              ?.slice(0, 2)
              .map((i) => i.product_name)
              .join("、") ?? null;

          return (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm text-caramel">
                        {order.order_no ?? order.order_number}
                      </p>
                      <p className="mt-1 text-xs text-foreground-secondary">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <Badge>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        typeLabel === "團購"
                          ? "bg-group-buy/15 text-group-buy"
                          : "bg-primary-soft text-primary"
                      }`}
                    >
                      {typeLabel}
                    </span>
                    {shipment?.method && (
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {SHIPMENT_METHOD_LABELS[shipment.method] ?? shipment.method}
                      </span>
                    )}
                    {payment?.gateway && (
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {PAYMENT_GATEWAY_LABELS[payment.gateway] ?? payment.gateway}
                      </span>
                    )}
                    {order.payment_status && (
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {ORDER_PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
                      </span>
                    )}
                  </div>

                  {summary && (
                    <p className="line-clamp-1 text-sm text-foreground-secondary">{summary}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="font-bold text-price">{formatCurrency(order.total_amount)}</p>
                    <span className="text-xs text-primary">查看詳細</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })
      )}
    </div>
  );
}
