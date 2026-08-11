"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCurrency,
  formatDate,
  SHIPMENT_METHOD_LABELS,
} from "@/lib/utils";
import {
  MEMBER_LIST_FILTERS,
  canonicalizeStatus,
  fulfillmentLabel,
  memberBucket,
} from "@/lib/fulfillment/status";
import type { Order, Shipment } from "@/lib/types/database";
import { APP_ROUTES } from "@/lib/site-links";

type OrdersClientProps = {
  hideTitle?: boolean;
  appOrdersOnly?: boolean;
};

function orderTypeLabel(order: Order): "團購" | "商城" {
  if (order.group_buy_event_id || order.channel === "group_buy") return "團購";
  return "商城";
}

function itemCount(order: Order) {
  return (order.order_items ?? []).reduce((sum, i) => sum + Number(i.quantity ?? 0), 0);
}

export function OrdersClient({ hideTitle = false, appOrdersOnly = false }: OrdersClientProps) {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") ?? "all";
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
    const spec = MEMBER_LIST_FILTERS.find((f) => f.key === filter);
    if (!spec || spec.key === "all") return orders;
    return orders.filter((o) =>
      spec.buckets.includes(memberBucket(canonicalizeStatus(o.status, o.fulfillment_status)))
    );
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
        <button type="button" className="text-sm text-primary hover:underline" onClick={() => window.location.reload()}>
          重新載入
        </button>
      </div>
    );
  }

  const titleBase = appOrdersOnly ? "我的 App 訂單" : "我的訂單";
  const basePath = appOrdersOnly ? APP_ROUTES.memberOrders : "/orders";

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <div>
          <h1 className="text-xl font-bold text-caramel">{titleBase}</h1>
          {appOrdersOnly && (
            <p className="mt-1 text-sm text-foreground-secondary">
              僅顯示透過 CHIMEIDIY App 建立的商城訂單，不包含門市現場消費紀錄。
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {MEMBER_LIST_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`${basePath}?filter=${f.key}`}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium leading-[44px] ${
              filter === f.key
                ? "bg-[#FFD454] text-[#153E73]"
                : "bg-white text-[#153E73] ring-1 ring-[#E7EAF0]"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="space-y-3 py-12 text-center">
          <p className="text-foreground-secondary">尚無 App 訂單</p>
          <Link href="/shop" className="text-sm text-primary hover:underline">
            前往商城選購
          </Link>
        </div>
      ) : (
        displayed.map((order) => {
          const shipment = (order.shipments as Shipment[] | undefined)?.[0];
          const fulfillment = canonicalizeStatus(order.status, order.fulfillment_status);
          const typeLabel = orderTypeLabel(order);
          const thumbs = (order.order_items ?? []).slice(0, 3);
          const storeName =
            (order as { pickup_store?: { name?: string } }).pickup_store?.name ??
            (order.stores as { name?: string } | undefined)?.name;

          return (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm text-caramel">
                      {order.order_no ?? order.order_number}
                    </p>
                    <p className="mt-1 text-xs text-foreground-secondary">{formatDate(order.created_at)}</p>
                  </div>
                  <Badge>{fulfillmentLabel(fulfillment)}</Badge>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      typeLabel === "團購" ? "bg-group-buy/15 text-group-buy" : "bg-primary-soft text-primary"
                    }`}
                  >
                    {typeLabel}
                  </span>
                  {shipment?.method && (
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      {SHIPMENT_METHOD_LABELS[shipment.method] ?? shipment.method}
                    </span>
                  )}
                  {storeName && (
                    <span className="rounded-full bg-muted px-2 py-0.5">取貨：{storeName}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {thumbs.map((item) => (
                    <span
                      key={item.id}
                      className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FFF5C7] text-[10px] text-[#153E73]"
                    >
                      {(item.product_name ?? "商品").slice(0, 2)}
                    </span>
                  ))}
                  <p className="text-xs text-foreground-secondary">共 {itemCount(order)} 件</p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-bold text-price">{formatCurrency(order.total_amount)}</p>
                  <OrderActions
                    orderId={order.id}
                    fulfillment={fulfillment}
                    detailHref={`${basePath === APP_ROUTES.memberOrders ? "/member/orders" : "/orders"}/${order.id}`}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

function OrderActions({
  orderId,
  fulfillment,
  detailHref,
}: {
  orderId: string;
  fulfillment: ReturnType<typeof canonicalizeStatus>;
  detailHref: string;
}) {
  const btn = "min-h-11 rounded-xl px-3 text-xs font-semibold";
  if (fulfillment === "pending_payment" || fulfillment === "payment_failed") {
    return (
      <div className="flex gap-2">
        <Link href={detailHref} className={`${btn} bg-[#FFD454] text-[#153E73] leading-[44px]`}>
          立即付款
        </Link>
        <CancelButton orderId={orderId} className={btn} />
      </div>
    );
  }
  if (fulfillment === "paid") {
    return (
      <div className="flex gap-2">
        <Link href={detailHref} className={`${btn} text-primary leading-[44px]`}>
          查看訂單
        </Link>
        <CancelButton orderId={orderId} className={btn} label="申請取消" />
      </div>
    );
  }
  if (fulfillment === "preparing") {
    return (
      <div className="flex gap-2">
        <Link href={detailHref} className={`${btn} text-primary leading-[44px]`}>
          查看進度
        </Link>
        <Link href={APP_ROUTES.support} className={`${btn} bg-white text-[#153E73] ring-1 ring-[#E7EAF0] leading-[44px]`}>
          聯絡客服
        </Link>
      </div>
    );
  }
  if (fulfillment === "ready_for_pickup") {
    return (
      <div className="flex gap-2">
        <Link href={detailHref} className={`${btn} bg-[#153E73] text-white leading-[44px]`}>
          顯示取貨碼
        </Link>
        <Link href={detailHref} className={`${btn} bg-white text-[#153E73] ring-1 ring-[#E7EAF0] leading-[44px]`}>
          門市導航
        </Link>
      </div>
    );
  }
  if (fulfillment === "shipped") {
    return (
      <div className="flex gap-2">
        <Link href={detailHref} className={`${btn} bg-white text-[#153E73] ring-1 ring-[#E7EAF0] leading-[44px]`}>
          查詢配送
        </Link>
        <Link href={detailHref} className={`${btn} text-primary leading-[44px]`}>
          查看訂單
        </Link>
      </div>
    );
  }
  if (["picked_up", "delivered", "completed"].includes(fulfillment)) {
    return (
      <div className="flex gap-2">
        <Link href="/shop" className={`${btn} bg-[#FFD454] text-[#153E73] leading-[44px]`}>
          再買一次
        </Link>
        <Link href={APP_ROUTES.support} className={`${btn} text-primary leading-[44px]`}>
          申請售後
        </Link>
      </div>
    );
  }
  if (["cancel_requested", "cancelled", "refund_pending", "refunded", "exception", "pickup_expired"].includes(fulfillment)) {
    return (
      <Link href={detailHref} className={`${btn} text-primary leading-[44px]`}>
        查看處理進度
      </Link>
    );
  }
  return (
    <Link href={detailHref} className={`${btn} text-primary leading-[44px]`}>
      查看訂單
    </Link>
  );
}

function CancelButton({
  orderId,
  className,
  label = "取消訂單",
}: {
  orderId: string;
  className: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      className={className}
      disabled={busy}
      onClick={async (e) => {
        e.preventDefault();
        if (!confirm("確定取消此訂單？")) return;
        setBusy(true);
        const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
        setBusy(false);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.error ?? "取消失敗");
          return;
        }
        window.location.reload();
      }}
    >
      {label}
    </Button>
  );
}
