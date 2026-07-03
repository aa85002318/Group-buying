"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function PaymentReportPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [lastFive, setLastFive] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/payment-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: params.orderId,
          amount: Number(amount),
          lastFiveDigits: lastFive,
          paymentMethod: "bank_transfer",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      alert("付款回報已送出，請等待確認");
      router.push(`/orders/${params.orderId}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-coffee">回報付款</h1>
      <p className="text-sm text-muted-foreground">請填寫轉帳資訊，我們將盡快為您確認。</p>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-4 shadow-card">
        <div>
          <label className="text-sm font-medium">轉帳金額</label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium">帳號後五碼</label>
          <Input value={lastFive} onChange={(e) => setLastFive(e.target.value)} maxLength={5} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "送出中..." : "送出回報"}
        </Button>
      </form>
      <div className="rounded-lg bg-muted p-3 text-sm">
        <p className="font-medium">轉帳帳號</p>
        <p>銀行：台灣銀行 (004)</p>
        <p>帳號：1234-5678-9012</p>
      </div>
    </div>
  );
}
