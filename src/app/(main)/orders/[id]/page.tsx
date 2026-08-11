"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PickupQrCode, OrderStatusBadges } from "@/components/orders/PickupQrCode";
import {
  formatCurrency,
  formatDate,
  PAYMENT_GATEWAY_LABELS,
  SHIPMENT_METHOD_LABELS,
  SHIPMENT_STATUS_LABELS,
} from "@/lib/utils";
import {
  getBankTransferInfo,
  getPaymentDeadlineHours,
  ORDER_PAYMENT_FLOW_STEPS,
  paymentDeadlineAt,
} from "@/lib/payment/instructions";
import {
  FULFILLMENT_STATUS_LABELS,
  canonicalizeStatus,
  fulfillmentLabel,
  pickupCodeAllowed,
  type FulfillmentStatus,
} from "@/lib/fulfillment/status";
import type { Order, OrderItem, OrderPayment, Shipment, Store } from "@/lib/types/database";
import { APP_ROUTES } from "@/lib/site-links";

const PROGRESS_STEPS: FulfillmentStatus[] = [
  "pending_payment",
  "paid",
  "preparing",
  "ready_for_pickup",
  "picked_up",
  "completed",
];

function progressIndex(status: FulfillmentStatus) {
  if (status === "shipped") return 3;
  if (status === "delivered") return 4;
  if (["cancel_requested", "cancelled", "refund_pending", "refunded", "exception", "pickup_expired"].includes(status)) {
    return -1;
  }
  const i = PROGRESS_STEPS.indexOf(status);
  if (status === "payment_failed") return 0;
  return i;
}

function isPaid(order: Order, payment?: OrderPayment | null) {
  if (["paid_online", "paid_store"].includes(order.payment_status ?? "")) return true;
  const fulfillment = canonicalizeStatus(order.status, order.fulfillment_status);
  if (["paid", "preparing", "ready_for_pickup", "shipped", "picked_up", "delivered", "completed"].includes(fulfillment)) {
    return true;
  }
  if (payment && ["paid_online", "paid_store"].includes(payment.status)) return true;
  return false;
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<
    (Order & { order_items?: OrderItem[]; stores?: Store }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d) => setOrder(d.order))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-muted-foreground">找不到此訂單</p>
        <Link href="/orders" className="text-sm text-primary hover:underline">
          返回訂單列表
        </Link>
      </div>
    );
  }

  const shipment = (order.shipments as Shipment[] | undefined)?.[0];
  const payment = (order.payments as OrderPayment[] | undefined)?.[0];
  const pickupStore = shipment?.stores ?? order.stores;
  const paid = isPaid(order, payment);
  const gateway = payment?.gateway ?? order.payment_method;
  const deadline = paymentDeadlineAt(order.created_at);
  const bank = getBankTransferInfo();
  const fulfillment = canonicalizeStatus(order.status, order.fulfillment_status);
  const awaiting =
    !paid && ["pending_payment", "payment_failed"].includes(fulfillment);

  return (
    <div className="space-y-4">
      <Link href={APP_ROUTES.memberOrders} className="text-sm text-primary hover:underline">
        ← 我的訂單
      </Link>

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-coffee">訂單詳情</h1>
        <Badge>{fulfillmentLabel(fulfillment)}</Badge>
      </div>

      <OrderStatusBadges paymentStatus={order.payment_status} pickupStatus={order.pickup_status} />

      {progressIndex(fulfillment) >= 0 && (
        <ol className="grid grid-cols-3 gap-2 rounded-xl bg-surface p-3 text-xs shadow-card sm:grid-cols-6">
          {PROGRESS_STEPS.map((step, idx) => {
            const current = progressIndex(fulfillment);
            const done = idx <= current;
            return (
              <li
                key={step}
                className={`min-h-11 rounded-lg px-2 py-2 text-center ${
                  done ? "bg-[#FFD454] font-semibold text-[#153E73]" : "bg-muted text-muted-foreground"
                }`}
              >
                {FULFILLMENT_STATUS_LABELS[step]}
              </li>
            );
          })}
        </ol>
      )}

      {order.estimated_ready_at && (
        <p className="text-sm text-[#153E73]">
          預計取貨／送達：{formatDate(order.estimated_ready_at)}
        </p>
      )}

      {awaiting && (
        <div className="space-y-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-foreground">
          <p className="font-semibold">取貨前請先完成付款</p>
          <p>
            下單後請於{" "}
            <strong>{getPaymentDeadlineHours()} 小時內</strong>
            （截止：{formatDate(deadline.toISOString())}）完成匯款或至門市繳費。
            <strong>繳費確認後訂單才正式成立</strong>，才能取貨。
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-foreground-secondary">
            {ORDER_PAYMENT_FLOW_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          {gateway === "bank_transfer" && (
            <div className="rounded-lg bg-surface/70 p-3 text-coffee">
              <p className="font-medium">匯款帳號</p>
              <p>
                {bank.bankName}（{bank.bankCode}）
              </p>
              <p>戶名：{bank.accountName}</p>
              <p className="font-mono">{bank.accountNumber}</p>
              <p className="mt-1 text-xs text-muted-foreground">{bank.note}</p>
            </div>
          )}

          {gateway === "store_cash" && (
            <p>
              您選擇<strong>門市付款</strong>：請至取貨門市繳費，由門市人員在系統標記「已收款」後，訂單才正式成立。
            </p>
          )}

          {gateway === "bank_transfer" && (
            <Link href={`/payment-report/${order.id}`}>
              <Button className="w-full">
                {order.status === "payment_reported" ? "再次回報／更新匯款資訊" : "回報匯款資訊"}
              </Button>
            </Link>
          )}
        </div>
      )}

      {order.status === "payment_reported" && !paid && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-coffee">
          已收到您的匯款回報，等待門市／後台確認中。確認後訂單即正式成立。
        </div>
      )}

      <div className="space-y-2 rounded-xl bg-surface p-4 text-sm shadow-card">
        <p>
          <span className="text-muted-foreground">訂單編號：</span>
          {order.order_no ?? order.order_number}
        </p>
        <p>
          <span className="text-muted-foreground">下單時間：</span>
          {formatDate(order.created_at)}
        </p>
        {order.referral_code && (
          <p>
            <span className="text-muted-foreground">推薦碼：</span>
            {order.referral_code}
          </p>
        )}
      </div>

      <div className="space-y-3 rounded-xl bg-surface p-4 text-sm shadow-card">
        <h2 className="font-medium text-coffee">配送資訊</h2>
        {shipment ? (
          <>
            <p>
              <span className="text-muted-foreground">方式：</span>
              {SHIPMENT_METHOD_LABELS[shipment.method] ?? shipment.method}
              <span className="ml-2 text-xs text-muted-foreground">
                （{SHIPMENT_STATUS_LABELS[shipment.status] ?? shipment.status}）
              </span>
            </p>
            {shipment.recipient_name && (
              <p>
                <span className="text-muted-foreground">聯絡人：</span>
                {shipment.recipient_name} {shipment.recipient_phone}
              </p>
            )}
            {shipment.method === "store_pickup" && pickupStore && (
              <div className="space-y-1">
                <p>
                  <span className="text-muted-foreground">取貨門市：</span>
                  {pickupStore.name}
                </p>
                <p className="text-muted-foreground">{pickupStore.address}</p>
                {pickupStore.phone && <p>電話：{pickupStore.phone}</p>}
                {pickupStore.business_hours && <p>營業時間：{pickupStore.business_hours}</p>}
                {order.pickup_deadline_at && (
                  <p>最晚取貨日：{formatDate(order.pickup_deadline_at)}</p>
                )}
                {pickupStore.navigation_url || pickupStore.map_url ? (
                  <a
                    href={pickupStore.navigation_url || pickupStore.map_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center text-primary underline"
                  >
                    門市導航
                  </a>
                ) : null}
              </div>
            )}
            {shipment.address && (
              <p>
                <span className="text-muted-foreground">地址：</span>
                {shipment.address}
              </p>
            )}
            {shipment.tracking_no && (
              <p>
                <span className="text-muted-foreground">物流單號：</span>
                {shipment.tracking_no}
                {shipment.carrier ? `（${shipment.carrier}）` : ""}
              </p>
            )}
            {shipment.cvs_store_id && (
              <p>
                <span className="text-muted-foreground">超商門市：</span>
                {shipment.cvs_store_id}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">門市取貨</p>
        )}
      </div>

      <div className="space-y-2 rounded-xl bg-surface p-4 text-sm shadow-card">
        <h2 className="font-medium text-coffee">付款資訊</h2>
        {payment || gateway ? (
          <>
            <p>
              <span className="text-muted-foreground">方式：</span>
              {PAYMENT_GATEWAY_LABELS[gateway ?? ""] ?? gateway ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">金額：</span>
              {formatCurrency(payment?.amount ?? order.total_amount)}
            </p>
            {payment?.merchant_trade_no && (
              <p>
                <span className="text-muted-foreground">交易編號：</span>
                <span className="font-mono text-xs">{payment.merchant_trade_no}</span>
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">待付款</p>
        )}
      </div>

      {shipment?.method === "store_pickup" && (
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <h2 className="mb-3 font-medium">取貨碼</h2>
          {pickupCodeAllowed(fulfillment) ? (
            <PickupQrCode orderId={order.id} />
          ) : (
            <p className="rounded-lg bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
              取貨碼僅在「可取貨」時顯示。請待門市完成備貨後再出示。
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl bg-surface p-4 shadow-card">
        <h2 className="mb-2 font-medium">商品明細</h2>
        {(order.order_items ?? []).map((item) => (
          <div key={item.id} className="flex justify-between border-b py-2 text-sm last:border-0">
            <span>
              {item.product_name} × {item.quantity}
            </span>
            <span>{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>商品小計</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {(order.discount ?? 0) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>折扣</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>運費</span>
            <span>{order.shipping_fee === 0 ? "免運" : formatCurrency(order.shipping_fee)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>總計</span>
            <span className="text-promo">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="rounded-xl bg-muted p-4 text-sm">
          <h2 className="mb-1 font-medium">備註</h2>
          <p className="whitespace-pre-wrap text-muted-foreground">{order.notes}</p>
        </div>
      )}

      {Array.isArray((order as unknown as { order_status_logs?: Array<{ id: string; to_status: string; note?: string | null; created_at: string }> }).order_status_logs) && (
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <h2 className="mb-2 font-medium">訂單狀態紀錄</h2>
          <ul className="space-y-2 text-sm">
            {(
              (order as unknown as { order_status_logs: Array<{ id: string; to_status: string; note?: string | null; created_at: string }> })
                .order_status_logs ?? []
            )
              .slice()
              .sort((a, b) => a.created_at.localeCompare(b.created_at))
              .map((log) => (
                <li key={log.id} className="flex justify-between gap-3 border-b border-border/60 py-1 last:border-0">
                  <span>
                    {FULFILLMENT_STATUS_LABELS[log.to_status as FulfillmentStatus] ?? log.to_status}
                    {log.note ? ` · ${log.note}` : ""}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <Link href={APP_ROUTES.support} className="inline-flex min-h-11 items-center text-sm text-primary underline">
        聯絡客服
      </Link>
    </div>
  );
}
