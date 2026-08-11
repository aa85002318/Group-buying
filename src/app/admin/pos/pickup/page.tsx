"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { QrScanner } from "@/components/staff/QrScanner";
import { formatCurrency } from "@/lib/utils";
import { FULFILLMENT_STATUS_LABELS, type FulfillmentStatus } from "@/lib/fulfillment/status";

type LookupOrder = {
  id: string;
  order_no?: string;
  order_number: string;
  fulfillment: FulfillmentStatus;
  payment_status?: string;
  customer_name: string;
  phone_last_three: string;
  notes?: string | null;
  pickup_deadline_at?: string | null;
  store_name?: string | null;
  total_amount: number;
  order_items?: Array<{ product_name: string; quantity: number }>;
};

export default function AdminPosPickupPage() {
  const [mode, setMode] = useState<"scan" | "pin" | "order" | "phone">("scan");
  const [value, setValue] = useState("");
  const [order, setOrder] = useState<LookupOrder | null>(null);
  const [list, setList] = useState<LookupOrder[]>([]);
  const [view, setView] = useState<"ready" | "expired" | "logs">("ready");
  const [logs, setLogs] = useState<
    Array<{
      id: string;
      redeemed_at: string;
      voided_at?: string | null;
      orders?: { order_no?: string; order_number?: string; customer_name?: string } | null;
    }>
  >([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadList = () => {
    fetch(`/api/admin/pos/pickup?view=${view}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.orders ?? []);
        setLogs(d.logs ?? []);
      });
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const lookup = async (payload: Record<string, string>) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/pos/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查詢失敗");
      setOrder(data.order);
    } catch (e) {
      setOrder(null);
      setMessage(e instanceof Error ? e.message : "查詢失敗");
    } finally {
      setBusy(false);
    }
  };

  const redeem = async () => {
    if (!order) return;
    if (!confirm("確定商品已完整交付會員嗎？\n完成後訂單將改為「已取貨」。")) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/pos/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "核銷失敗");
      setMessage("已完成取貨核銷");
      setOrder(null);
      loadList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "核銷失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="POS 訂單取貨核銷"
        description="掃描 QR、輸入 6 位取貨碼、訂單編號或會員手機。不可只用會員條碼直接完成取貨。"
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["scan", "掃描 QR"],
            ["pin", "6 位取貨碼"],
            ["order", "訂單編號"],
            ["phone", "會員手機"],
          ] as const
        ).map(([k, label]) => (
          <Button key={k} variant={mode === k ? "default" : "outline"} onClick={() => setMode(k)}>
            {label}
          </Button>
        ))}
        <Button variant={view === "ready" ? "secondary" : "outline"} onClick={() => setView("ready")}>
          今日待取貨
        </Button>
        <Button variant={view === "expired" ? "secondary" : "outline"} onClick={() => setView("expired")}>
          逾期未取
        </Button>
        <Button variant={view === "logs" ? "secondary" : "outline"} onClick={() => setView("logs")}>
          核銷紀錄
        </Button>
      </div>

      {mode === "scan" ? (
        <QrScanner onScan={(text) => lookup({ token: text })} />
      ) : (
        <div className="flex max-w-md gap-2">
          <Input
            className="min-h-11"
            placeholder={mode === "pin" ? "6 位數字" : mode === "order" ? "訂單編號" : "手機號碼"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button
            className="min-h-11"
            disabled={busy}
            onClick={() =>
              lookup(
                mode === "pin" ? { pin: value } : mode === "order" ? { orderNo: value } : { phone: value }
              )
            }
          >
            查詢
          </Button>
        </div>
      )}

      {message && <p className="text-sm text-[#153E73]">{message}</p>}

      {order && (
        <div className="max-w-lg space-y-3 rounded-2xl bg-white p-5 shadow-card">
          <p className="font-mono text-sm">{order.order_no ?? order.order_number}</p>
          <p>會員：{order.customer_name}　手機末三碼：{order.phone_last_three}</p>
          <p>門市：{order.store_name ?? "—"}</p>
          <p>
            狀態：{FULFILLMENT_STATUS_LABELS[order.fulfillment] ?? order.fulfillment}　付款：
            {order.payment_status ?? "—"}
          </p>
          <p>
            最晚取貨：
            {order.pickup_deadline_at
              ? new Date(order.pickup_deadline_at).toLocaleDateString("zh-TW")
              : "—"}
          </p>
          <ul className="text-sm">
            {(order.order_items ?? []).map((i, idx) => (
              <li key={idx}>
                {i.product_name} × {i.quantity}
              </li>
            ))}
          </ul>
          <p className="font-bold">{formatCurrency(order.total_amount)}</p>
          {order.notes && <p className="text-sm text-[#8A94A6]">備註：{order.notes}</p>}
          <Button className="min-h-11 w-full" disabled={busy} onClick={redeem}>
            確認完成取貨
          </Button>
        </div>
      )}

      {view === "logs" ? (
        <section>
          <h2 className="mb-2 font-semibold text-[#153E73]">核銷紀錄</h2>
          <div className="space-y-2">
            {logs.map((row) => (
              <div key={row.id} className="rounded-xl bg-white px-4 py-3 text-sm shadow-card">
                <p className="font-mono">{row.orders?.order_no ?? row.orders?.order_number ?? row.id}</p>
                <p className="text-xs text-[#8A94A6]">
                  {new Date(row.redeemed_at).toLocaleString("zh-TW")}
                  {row.voided_at ? "　已取消核銷" : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
      <section>
        <h2 className="mb-2 font-semibold text-[#153E73]">
          {view === "expired" ? "逾期未取" : "待取貨清單"}
        </h2>
        <div className="space-y-2">
          {list.map((row) => (
            <button
              key={row.id}
              type="button"
              className="flex min-h-11 w-full items-center justify-between rounded-xl bg-white px-4 text-left shadow-card"
              onClick={() => lookup({ orderNo: row.order_no ?? row.order_number })}
            >
              <span className="font-mono text-sm">{row.order_no ?? row.order_number}</span>
              <span className="text-xs text-[#8A94A6]">{row.customer_name}</span>
            </button>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}
