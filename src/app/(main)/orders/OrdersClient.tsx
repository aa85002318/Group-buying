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

export function OrdersClient() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/my")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => {})
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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-coffee">
        我的訂單{filter && FILTER_LABELS[filter] ? ` · ${FILTER_LABELS[filter]}` : ""}
      </h1>

      {displayed.length === 0 ? (
        <div className="space-y-3 py-12 text-center">
          <p className="text-muted-foreground">尚無訂單</p>
          <Link href="/products" className="text-sm text-primary hover:underline">
            前往選購
          </Link>
        </div>
      ) : (
        displayed.map((order) => {
          const shipment = (order.shipments as Shipment[] | undefined)?.[0];
          const payment = (order.payments as OrderPayment[] | undefined)?.[0];

          return (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm text-coffee">{order.order_no ?? order.order_number}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <Badge>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
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

                  <p className="font-bold text-promo">{formatCurrency(order.total_amount)}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })
      )}
    </div>
  );
}
