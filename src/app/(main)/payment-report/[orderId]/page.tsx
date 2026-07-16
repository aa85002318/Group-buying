"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  getBankTransferInfo,
  getPaymentDeadlineHours,
} from "@/lib/payment/instructions";

export default function PaymentReportPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [lastFive, setLastFive] = useState("");
  const [notes, setNotes] = useState("");
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const bank = getBankTransferInfo();

  useEffect(() => {
    fetch(`/api/orders/${params.orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.order?.total_amount != null) {
          setOrderTotal(Number(d.order.total_amount));
          setAmount(String(d.order.total_amount));
        }
      })
      .catch(() => {});
  }, [params.orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(lastFive.trim())) {
      alert("請填寫正確的帳號後五碼（5 位數字）");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payment-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: params.orderId,
          amount: Number(amount),
          lastFiveDigits: lastFive.trim(),
          paymentMethod: "bank_transfer",
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      alert("匯款回報已送出，請等待門市／後台確認。確認後訂單才正式成立。");
      router.push(`/orders/${params.orderId}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link href={`/orders/${params.orderId}`} className="text-sm text-primary hover:underline">
        ← 返回訂單
      </Link>
      <h1 className="text-xl font-bold text-coffee">回報匯款資訊</h1>
      <p className="text-sm text-muted-foreground">
        請於 {getPaymentDeadlineHours()}{" "}
        小時內完成匯款，並填寫下方資訊。門市／後台確認收款後，訂單才正式成立並可取貨。
      </p>

      <div className="rounded-xl bg-white p-4 text-sm shadow-card">
        <p className="font-medium text-coffee">匯款帳號</p>
        <p className="mt-2">
          {bank.bankName}（{bank.bankCode}）
        </p>
        <p>戶名：{bank.accountName}</p>
        <p className="font-mono text-base">{bank.accountNumber}</p>
        {orderTotal != null && (
          <p className="mt-2 font-semibold text-promo">應付金額：{formatCurrency(orderTotal)}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{bank.note}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-4 shadow-card">
        <div>
          <label className="text-sm font-medium">匯款金額</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min={1}
          />
        </div>
        <div>
          <label className="text-sm font-medium">匯出帳號後五碼</label>
          <Input
            value={lastFive}
            onChange={(e) => setLastFive(e.target.value.replace(/\D/g, "").slice(0, 5))}
            maxLength={5}
            inputMode="numeric"
            placeholder="例如 12345"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">備註（選填）</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="匯款時間或其他說明"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "送出中..." : "送出匯款回報"}
        </Button>
      </form>
    </div>
  );
}
