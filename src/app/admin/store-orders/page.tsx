"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FULFILLMENT_STATUS_LABELS, type FulfillmentStatus } from "@/lib/fulfillment/status";

type Row = {
  id: string;
  order_no?: string;
  order_number: string;
  fulfillment: FulfillmentStatus;
  payment_status?: string;
  total_amount: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  created_at: string;
  pickup_deadline_at?: string | null;
  pickup_store?: { name?: string } | null;
  notes?: string | null;
  exception_reason?: string | null;
};

const ACTIONS: Array<{ action: string; label: string; manager?: boolean }> = [
  { action: "accept", label: "接受／開始備貨" },
  { action: "mark_ready", label: "完成備貨並通知" },
  { action: "notify_pickup", label: "重發取貨通知" },
  { action: "extend_deadline", label: "延長期限", manager: true },
  { action: "mark_out_of_stock", label: "標示缺貨" },
  { action: "request_cancel", label: "取消", manager: true },
  { action: "request_refund", label: "申請退款", manager: true },
];

export default function AdminStoreOrdersPage() {
  const [orders, setOrders] = useState<Row[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sku, setSku] = useState("");
  const [loading, setLoading] = useState(true);
  const [logsOrderId, setLogsOrderId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ id: string; to_status: string; note?: string | null; created_at: string }>>([]);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (sku) params.set("sku", sku);
    fetch(`/api/admin/store-orders?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders ?? []);
        setStats(d.stats ?? {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const act = async (id: string, action: string) => {
    const note = action.startsWith("mark") || action.startsWith("request")
      ? prompt("備註（選填）") ?? ""
      : "";
    const res = await fetch(`/api/admin/store-orders/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "操作失敗");
      return;
    }
    load();
  };

  const printPicklist = async (row: Row) => {
    const res = await fetch(`/api/admin/store-orders/${row.id}`);
    const data = await res.json();
    const items = (data.order?.order_items ?? []) as Array<{
      product_name?: string;
      quantity?: number;
      product_id?: string;
    }>;
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) return;
    const rows = items
      .map(
        (i) =>
          `<tr><td>${i.product_id ?? ""}</td><td>${i.product_name ?? ""}</td><td>${i.quantity ?? ""}</td><td>常溫</td></tr>`
      )
      .join("");
    w.document.write(`<!doctype html><html><head><title>備貨單 ${row.order_no ?? row.order_number}</title>
      <style>body{font-family:sans-serif;padding:24px;color:#153E73}h1{font-size:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px;text-align:left}</style>
      </head><body>
      <h1>CHIMEIDIY 備貨單</h1>
      <p>訂單 ${row.order_no ?? row.order_number}</p>
      <p>會員 ${row.customer_name ?? "—"}　手機末三碼 ${(row.customer_phone ?? "").slice(-3)}</p>
      <p>門市 ${row.pickup_store?.name ?? "—"}</p>
      <p>訂購時間 ${new Date(row.created_at).toLocaleString("zh-TW")}</p>
      <p>最晚取貨 ${row.pickup_deadline_at ? new Date(row.pickup_deadline_at).toLocaleDateString("zh-TW") : "—"}</p>
      <p>備註 ${row.notes ?? "—"}</p>
      <table><thead><tr><th>SKU</th><th>商品</th><th>數量</th><th>溫層</th></tr></thead><tbody>${rows}</tbody></table>
      <p>備貨人員簽名：____________　複核：____________</p>
      </body></html>`);
    w.document.close();
    w.print();
  };

  const showLogs = async (id: string) => {
    const res = await fetch(`/api/admin/store-orders/${id}`);
    const data = await res.json();
    setLogsOrderId(id);
    setLogs(data.order?.order_status_logs ?? []);
  };

  const cards = [
    ["今日新增", stats.todayNew],
    ["待備貨", stats.awaitingPrep],
    ["備貨中", stats.preparing],
    ["今日可取貨", stats.readyToday],
    ["今日已取貨", stats.pickedToday],
    ["即將逾期", stats.expiringSoon],
    ["逾期未取", stats.expired],
    ["異常訂單", stats.exception],
  ] as const;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="門市取貨訂單"
        description="接受訂單、備貨、通知取貨與異常處理。POS 核銷請至「訂單取貨核銷」。"
        actions={
          <Link href="/admin/pos/pickup" className="text-sm text-[#153E73] underline">
            前往 POS 核銷
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow-card">
            <p className="text-xs text-[#8A94A6]">{label}</p>
            <p className="mt-1 text-2xl font-black text-[#153E73]">{value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="訂單編號／姓名／手機"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <Input
          className="max-w-[160px]"
          placeholder="商品 SKU／名稱"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">全部狀態</option>
          {Object.entries(FULFILLMENT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <Button onClick={load}>搜尋</Button>
      </div>

      <AdminTable
        columns={[
          {
            key: "no",
            header: "訂單",
            render: (r) => <span className="font-mono text-xs">{r.order_no ?? r.order_number}</span>,
          },
          { key: "member", header: "會員", render: (r) => r.customer_name ?? "—" },
          { key: "phone", header: "手機", render: (r) => r.customer_phone ?? "—" },
          {
            key: "st",
            header: "狀態",
            render: (r) => FULFILLMENT_STATUS_LABELS[r.fulfillment] ?? r.fulfillment,
          },
          { key: "amt", header: "金額", render: (r) => formatCurrency(r.total_amount) },
          {
            key: "store",
            header: "門市",
            render: (r) => r.pickup_store?.name ?? "—",
          },
          {
            key: "due",
            header: "最晚取貨",
            render: (r) =>
              r.pickup_deadline_at ? (
                <span className="text-xs">{formatDate(r.pickup_deadline_at)}</span>
              ) : (
                "—"
              ),
          },
          {
            key: "act",
            header: "操作",
            render: (r) => (
              <div className="flex flex-wrap gap-1">
                {ACTIONS.map((a) => (
                  <Button key={a.action} size="sm" variant="outline" onClick={() => act(r.id, a.action)}>
                    {a.label}
                  </Button>
                ))}
                <Button size="sm" variant="secondary" onClick={() => printPicklist(r)}>
                  列印備貨單
                </Button>
                <Button size="sm" variant="ghost" onClick={() => showLogs(r.id)}>
                  查看紀錄
                </Button>
              </div>
            ),
          },
        ]}
        rows={orders}
        loading={loading}
        emptyText="沒有門市取貨訂單"
      />

      {logsOrderId && (
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-[#153E73]">操作紀錄</h2>
            <Button size="sm" variant="ghost" onClick={() => setLogsOrderId(null)}>
              關閉
            </Button>
          </div>
          {logs.length === 0 ? (
            <p className="text-sm text-[#8A94A6]">尚無紀錄</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {logs.map((log) => (
                <li key={log.id}>
                  {new Date(log.created_at).toLocaleString("zh-TW")}　
                  {FULFILLMENT_STATUS_LABELS[log.to_status as FulfillmentStatus] ?? log.to_status}
                  {log.note ? ` · ${log.note}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
