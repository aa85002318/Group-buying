"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  formatCurrency,
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_PICKUP_STATUS_LABELS,
  ORDER_STATUS_LABELS,
} from "@/lib/utils";
import type { PickupLookupResult } from "@/lib/types/database";

interface PickupOrderPanelProps {
  order: PickupLookupResult;
  loading?: boolean;
  message?: string | null;
  issueNotes?: string;
  onIssueNotesChange?: (value: string) => void;
  onConfirmPayment: () => void;
  onConfirmPickup: () => void;
  onReportIssue?: () => void;
}

export function PickupOrderPanel({
  order,
  loading = false,
  message,
  issueNotes = "",
  onIssueNotesChange,
  onConfirmPayment,
  onConfirmPickup,
  onReportIssue,
}: PickupOrderPanelProps) {
  const isPaid = order.payment_status === "paid_store" || order.payment_status === "paid_online";
  const isPickedUp = order.pickup_status === "picked_up";

  return (
    <Card>
      <CardContent className="space-y-3 p-4 text-sm">
        {message && (
          <p className={`text-sm ${message.includes("成功") ? "text-green-600" : "text-destructive"}`}>
            {message}
          </p>
        )}

        <div className="flex justify-between">
          <span className="text-muted-foreground">訂單編號</span>
          <span className="font-mono font-medium">{order.order_no}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">客戶姓名</span>
          <span>{order.customer_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">手機末三碼</span>
          <span className="font-mono">{order.phone_last_three}</span>
        </div>

        <div className="border-t pt-3">
          <p className="mb-2 font-medium">商品明細</p>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between py-1">
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between border-t pt-2 font-bold">
          <span>訂單金額</span>
          <span className="text-promo">{formatCurrency(order.total_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">付款狀態</span>
          <span>{ORDER_PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">取貨狀態</span>
          <span>{ORDER_PICKUP_STATUS_LABELS[order.pickup_status] ?? order.pickup_status}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">訂單狀態</span>
          <span>{ORDER_STATUS_LABELS[order.order_status as keyof typeof ORDER_STATUS_LABELS] ?? order.order_status}</span>
        </div>

        {isPickedUp ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-center text-sm font-medium">此訂單已完成取貨</p>
        ) : (
          <div className="grid gap-2 pt-2">
            {!isPaid && (
              <Button variant="promo" disabled={loading} onClick={onConfirmPayment}>
                確認收款
              </Button>
            )}
            {isPaid && (
              <Button disabled={loading} onClick={onConfirmPickup}>
                確認取貨
              </Button>
            )}
            {onReportIssue && onIssueNotesChange && (
              <>
                <Input
                  value={issueNotes}
                  onChange={(e) => onIssueNotesChange(e.target.value)}
                  placeholder="異常說明（選填）"
                />
                <Button variant="outline" disabled={loading || !issueNotes.trim()} onClick={onReportIssue}>
                  異常回報
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
