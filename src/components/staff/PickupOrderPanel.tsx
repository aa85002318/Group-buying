"use client";

import { Button } from "@/components/ui/button";
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
  const isPaid =
    order.payment_status === "paid_store" || order.payment_status === "paid_online";
  const isPickedUp = order.pickup_status === "picked_up";

  return (
    <div className="space-y-3 rounded-[20px] bg-white p-4 text-sm shadow-[0_8px_24px_rgba(21,62,115,.06)] ring-1 ring-[#E6E9EF]">
      {message && (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            message.includes("成功")
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      )}

      <div className="flex justify-between gap-2">
        <span className="text-[#687386]">訂單編號</span>
        <span className="font-mono font-semibold text-[#153E73]">{order.order_no}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-[#687386]">客戶姓名</span>
        <span className="font-medium text-[#153E73]">{order.customer_name}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-[#687386]">手機末三碼</span>
        <span className="font-mono font-semibold text-[#153E73]">{order.phone_last_three}</span>
      </div>

      <div className="border-t border-[#E6E9EF] pt-3">
        <p className="mb-2 font-semibold text-[#153E73]">商品明細</p>
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between gap-2 py-1 text-[#153E73]">
            <span>
              {item.product_name} × {item.quantity}
            </span>
            <span>{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between border-t border-[#E6E9EF] pt-2 text-base font-bold text-[#153E73]">
        <span>訂單金額</span>
        <span>{formatCurrency(order.total_amount)}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-[#687386]">付款狀態</span>
        <span>
          {ORDER_PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-[#687386]">取貨狀態</span>
        <span>
          {ORDER_PICKUP_STATUS_LABELS[order.pickup_status] ?? order.pickup_status}
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-[#687386]">訂單狀態</span>
        <span>
          {ORDER_STATUS_LABELS[order.order_status as keyof typeof ORDER_STATUS_LABELS] ??
            order.order_status}
        </span>
      </div>

      {isPickedUp ? (
        <p className="rounded-xl bg-[#F7F8FA] px-3 py-2 text-center text-sm font-semibold text-[#153E73]">
          此訂單已完成取貨
        </p>
      ) : (
        <div className="grid gap-2 pt-2">
          {!isPaid && (
            <Button
              className="border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73] hover:bg-[#FFE149]/90"
              disabled={loading}
              onClick={onConfirmPayment}
            >
              確認門市已收款
            </Button>
          )}
          {isPaid && (
            <Button
              className="bg-[#153E73] font-bold text-white hover:bg-[#153E73]/90"
              disabled={loading}
              onClick={onConfirmPickup}
            >
              確認取貨完成
            </Button>
          )}
          {onReportIssue && onIssueNotesChange && (
            <>
              <Input
                value={issueNotes}
                onChange={(e) => onIssueNotesChange(e.target.value)}
                placeholder="異常說明（選填）"
              />
              <Button
                variant="outline"
                disabled={loading || !issueNotes.trim()}
                onClick={onReportIssue}
              >
                異常回報
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
