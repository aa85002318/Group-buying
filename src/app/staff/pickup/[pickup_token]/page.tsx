"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PickupOrderPanel } from "@/components/staff/PickupOrderPanel";
import type { PickupLookupResult } from "@/lib/types/database";

export default function StaffPickupConfirmPage() {
  const params = useParams();
  const pickupToken = String(params.pickup_token ?? "");
  const [order, setOrder] = useState<PickupLookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!pickupToken) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/staff/pickup/${encodeURIComponent(pickupToken)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查詢失敗");
      setOrder(data.order);
    } catch (e) {
      setOrder(null);
      setMessage(e instanceof Error ? e.message : "查詢失敗");
    } finally {
      setLoading(false);
    }
  }, [pickupToken]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (path: string, body: Record<string, unknown>) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "操作失敗");
      setMessage(data.message ?? "操作成功，已寄送取貨完成通知信");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "操作失敗");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !order) {
    return <div className="p-4 text-center text-muted-foreground">載入中...</div>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-8">
      <Link href="/staff/pickup-scan" className="text-sm text-primary hover:underline">
        ← 返回掃碼頁
      </Link>
      <h1 className="text-xl font-bold text-coffee">取貨確認</h1>

      {!order ? (
        <p className="text-muted-foreground">{message ?? "找不到訂單"}</p>
      ) : (
        <PickupOrderPanel
          order={order}
          loading={loading}
          message={message}
          onConfirmPayment={() => act("/api/staff/pickup/confirm-payment", { order_id: order.order_id })}
          onConfirmPickup={() => act("/api/staff/pickup/confirm-pickup", { order_id: order.order_id })}
        />
      )}
    </div>
  );
}
