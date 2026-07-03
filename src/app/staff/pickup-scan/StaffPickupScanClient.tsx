"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PickupOrderPanel } from "@/components/staff/PickupOrderPanel";
import { QrScanner } from "@/components/staff/QrScanner";
import { parsePickupToken } from "@/lib/staff/pickup-token";
import type { PickupLookupResult } from "@/lib/types/database";

export default function StaffPickupScanClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [order, setOrder] = useState<PickupLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [issueNotes, setIssueNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const lookup = useCallback(async (pickupToken: string) => {
    const parsed = parsePickupToken(pickupToken);
    if (!parsed) return;
    setToken(parsed);
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/staff/pickup/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup_token: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查詢失敗");
      setOrder(data.order);
    } catch (e) {
      setOrder(null);
      setMessage(e instanceof Error ? e.message : "查詢失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) lookup(t);
  }, [searchParams, lookup]);

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
      setMessage(data.message ?? "操作成功");
      if (order) await lookup(token);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "操作失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (scanned: string) => {
    const parsed = parsePickupToken(scanned);
    router.replace(`/staff/pickup/${encodeURIComponent(parsed)}`);
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-8">
      <div>
        <h1 className="text-xl font-bold text-coffee">門市取貨掃碼</h1>
        <p className="text-sm text-muted-foreground">掃描客戶 QR Code 或手動輸入取貨碼</p>
      </div>

      <QrScanner onScan={handleScan} disabled={loading} />

      <div className="flex gap-2">
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="輸入取貨碼"
          className="font-mono text-sm"
        />
        <Button onClick={() => lookup(token)} disabled={loading}>
          查詢
        </Button>
      </div>

      {order && (
        <PickupOrderPanel
          order={order}
          loading={loading}
          message={message}
          issueNotes={issueNotes}
          onIssueNotesChange={setIssueNotes}
          onConfirmPayment={() => act("/api/staff/pickup/confirm-payment", { order_id: order.order_id })}
          onConfirmPickup={() => act("/api/staff/pickup/confirm-pickup", { order_id: order.order_id })}
          onReportIssue={() =>
            act("/api/staff/pickup/report-issue", { order_id: order.order_id, notes: issueNotes })
          }
        />
      )}

      {!order && message && !loading && (
        <p className="text-sm text-destructive">{message}</p>
      )}
    </div>
  );
}
