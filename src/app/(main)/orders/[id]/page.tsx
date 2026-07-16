"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PickupQrCode, OrderStatusBadges } from "@/components/orders/PickupQrCode";
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
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
import type { Order, OrderItem, OrderPayment, Shipment, Store } from "@/lib/types/database";

function isPaid(order: Order, payment?: OrderPayment | null) {
  if (["paid_online", "paid_store"].includes(order.payment_status ?? "")) return true;
  if (["payment_confirmed", "preparing", "ready_for_pickup", "completed"].includes(order.status)) {
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
  const awaiting =
    !paid && ["awaiting_payment", "payment_reported", "pending"].includes(order.status);

  return (
    <div className="space-y-4">
      <Link href="/orders" className="text-sm text-primary hover:underline">
        ← 我的訂單
      </Link>

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-coffee">訂單詳情</h1>
        <Badge>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
      </div>

      <OrderStatusBadges paymentStatus={order.payment_status} pickupStatus={order.pickup_status} />

      {awaiting && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">取貨前請先完成付款</p>
          <p>
            下單後請於{" "}
            <strong>{getPaymentDeadlineHours()} 小時內</strong>
            （截止：{formatDate(deadline.toISOString())}）完成匯款或至門市繳費。
            <strong>繳費確認後訂單才正式成立</strong>，才能取貨。
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-amber-900/90">
            {ORDER_PAYMENT_FLOW_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          {gateway === "bank_transfer" && (
            <div className="rounded-lg bg-white/70 p-3 text-coffee">
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

      <div className="space-y-2 rounded-xl bg-white p-4 text-sm shadow-card">
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

      <div className="space-y-3 rounded-xl bg-white p-4 text-sm shadow-card">
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
              <p>
                <span className="text-muted-foreground">取貨門市：</span>
                {pickupStore.name} — {pickupStore.address}
              </p>
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

      <div className="space-y-2 rounded-xl bg-white p-4 text-sm shadow-card">
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
        <div className="rounded-xl bg-white p-4 shadow-card">
          <h2 className="mb-3 font-medium">取貨 QR Code</h2>
          {paid ? (
            <PickupQrCode orderId={order.id} />
          ) : (
            <p className="rounded-lg bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
              付款確認後才會開放取貨 QR Code。請先完成匯款回報或至門市繳費。
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl bg-white p-4 shadow-card">
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
    </div>
  );
}
