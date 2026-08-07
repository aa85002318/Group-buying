"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PickupOrderPanel } from "@/components/staff/PickupOrderPanel";
import { QrScanner } from "@/components/staff/QrScanner";
import { parsePickupToken } from "@/lib/staff/pickup-token";
import type { PickupLookupResult } from "@/lib/types/database";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

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
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-10">
      <div>
        <p className="text-xs font-semibold text-[#687386]">
          <Link href={APP_ROUTES.staffHome} className="underline">
            今日作業
          </Link>{" "}
          / 掃碼取貨
        </p>
        <h1 className="mt-1 text-xl font-bold text-[#153E73]">App 訂單取貨</h1>
        <p className="text-sm text-[#687386]">
          掃描客戶取貨 QR，或手動輸入取貨碼。僅處理 App 訂單，不含門市 POS。
        </p>
      </div>

      <ol className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-[#153E73]">
        <li className="rounded-xl bg-[#FFFBEA] px-2 py-2 ring-1 ring-[#FFE149]/70">1. 掃碼／輸入</li>
        <li className="rounded-xl bg-white px-2 py-2 ring-1 ring-[#E6E9EF]">2. 確認收款</li>
        <li className="rounded-xl bg-white px-2 py-2 ring-1 ring-[#E6E9EF]">3. 確認取貨</li>
      </ol>

      <QrScanner onScan={handleScan} disabled={loading} />

      <div className="flex gap-2">
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="輸入取貨碼"
          className="font-mono text-sm"
        />
        <Button
          className="border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73] hover:bg-[#FFE149]/90"
          onClick={() => lookup(token)}
          disabled={loading}
        >
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
          onConfirmPayment={() =>
            act("/api/staff/pickup/confirm-payment", { order_id: order.order_id })
          }
          onConfirmPickup={() =>
            act("/api/staff/pickup/confirm-pickup", { order_id: order.order_id })
          }
          onReportIssue={() =>
            act("/api/staff/pickup/report-issue", {
              order_id: order.order_id,
              notes: issueNotes,
            })
          }
        />
      )}

      {!order && message && !loading && (
        <p className="text-sm text-destructive">{message}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href={APP_ROUTES.staffHome}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          回今日作業
        </Link>
        <Link
          href="/admin/store"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          門市協作中心
        </Link>
      </div>
    </div>
  );
}
