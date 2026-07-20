"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Tab =
  | "overview"
  | "members"
  | "inventory"
  | "batches"
  | "anomalies"
  | "returns"
  | "disposals"
  | "reservations";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "總覽" },
  { id: "members", label: "門市會員" },
  { id: "inventory", label: "庫存" },
  { id: "batches", label: "效期／批號" },
  { id: "anomalies", label: "異常" },
  { id: "returns", label: "退貨" },
  { id: "disposals", label: "報廢" },
  { id: "reservations", label: "客人訂購" },
];

export default function AdminStorePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [members, setMembers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [memberNo, setMemberNo] = useState("");
  const [notes, setNotes] = useState("");
  const [phoneHint, setPhoneHint] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadResource = useCallback(async (resource: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/store?resource=${resource}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store-members");
      const data = await res.json();
      setMembers(data.members ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "overview") return;
    if (tab === "members") {
      void loadMembers();
      return;
    }
    void loadResource(tab);
  }, [tab, loadMembers, loadResource]);

  const checkPhone = async () => {
    if (!phone.trim()) return;
    const res = await fetch("/api/store-members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setPhoneHint(data.phoneMatch?.message ?? null);
  };

  const createMember = async () => {
    setMsg(null);
    const res = await fetch("/api/store-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        store_member_no: memberNo || null,
        notes: notes || null,
        source: "manual",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "新增失敗");
      return;
    }
    if (data.phoneMatch?.matched) {
      setPhoneHint(data.phoneMatch.message);
    }
    setMsg("已新增門市會員（僅電話）");
    setPhone("");
    setMemberNo("");
    setNotes("");
    void loadMembers();
  };

  const exportData = async () => {
    const res = await fetch("/api/store?resource=export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.export, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `store-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="門市管理"
        description="效期、批號、異常、退貨、報廢、訂購與門市會員（僅電話）— 商品一律使用 Product Master"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportData}>
              Export
            </Button>
            <Link href="/admin/products">
              <Button variant="outline">商品主檔</Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline">統一訂單</Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "門市會員", desc: "僅電話／編號／來源／備註", tab: "members" as Tab },
            { title: "效期批號", desc: "store_batches → products", tab: "batches" as Tab },
            { title: "客人訂購", desc: "Store Reservation 渠道", tab: "reservations" as Tab },
          ].map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => setTab(card.tab)}
              className="rounded-[20px] border border-[#E8EBF4] bg-white p-5 text-left shadow-[0_4px_24px_rgba(30,58,138,0.06)]"
            >
              <p className="text-lg font-black text-[#1E3A8A]">{card.title}</p>
              <p className="mt-1 text-sm text-[#64748B]">{card.desc}</p>
            </button>
          ))}
        </div>
      )}

      {tab === "members" && (
        <div className="space-y-4">
          <div className="rounded-[20px] border border-[#E8EBF4] bg-white p-5 space-y-3">
            <p className="font-bold text-[#1E3A8A]">新增門市會員（僅電話）</p>
            <p className="text-xs text-[#64748B]">
              不得寫入姓名、Email、地址；與線上會員電話相同時僅提示，不自動合併。
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                placeholder="電話 *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => void checkPhone()}
              />
              <Input
                placeholder="門市會員編號"
                value={memberNo}
                onChange={(e) => setMemberNo(e.target.value)}
              />
              <Input placeholder="備註" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {phoneHint && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{phoneHint}</p>
            )}
            {msg && <p className="text-sm text-green-700">{msg}</p>}
            <Button onClick={() => void createMember()} disabled={!phone.trim()}>
              新增
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-[#64748B]">載入中…</p>
          ) : (
            <div className="overflow-x-auto rounded-[20px] border border-[#E8EBF4] bg-white">
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFC] text-left text-[#64748B]">
                  <tr>
                    <th className="px-4 py-3">電話</th>
                    <th className="px-4 py-3">編號</th>
                    <th className="px-4 py-3">來源</th>
                    <th className="px-4 py-3">建立</th>
                    <th className="px-4 py-3">備註</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={String(m.id)} className="border-t border-[#E8EBF4]">
                      <td className="px-4 py-3 font-medium">{String(m.phone)}</td>
                      <td className="px-4 py-3">{String(m.store_member_no ?? "—")}</td>
                      <td className="px-4 py-3">{String(m.source)}</td>
                      <td className="px-4 py-3">
                        {m.created_at
                          ? new Date(String(m.created_at)).toLocaleDateString("zh-TW")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">{String(m.notes ?? "—")}</td>
                    </tr>
                  ))}
                  {!members.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#64748B]">
                        尚無門市會員
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab !== "overview" && tab !== "members" && (
        <div className="overflow-x-auto rounded-[20px] border border-[#E8EBF4] bg-white">
          {loading ? (
            <p className="p-6 text-sm text-[#64748B]">載入中…</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] text-left text-[#64748B]">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">商品</th>
                  <th className="px-4 py-3">詳情</th>
                  <th className="px-4 py-3">狀態</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const product = item.products as { name?: string; sku?: string } | null;
                  return (
                    <tr key={String(item.id)} className="border-t border-[#E8EBF4]">
                      <td className="px-4 py-3 font-mono text-xs">
                        {String(item.id).slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        {product?.name ?? String(item.product_id ?? "—")}
                        {product?.sku ? (
                          <span className="ml-2 text-xs text-[#64748B]">{product.sku}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">
                        {item.batch_no
                          ? `批號 ${String(item.batch_no)}`
                          : item.quantity != null
                            ? `數量 ${String(item.quantity)}`
                            : item.description
                              ? String(item.description).slice(0, 40)
                              : item.customer_phone
                                ? String(item.customer_phone)
                                : "—"}
                        {item.expiry_date ? ` · 效期 ${String(item.expiry_date)}` : ""}
                      </td>
                      <td className="px-4 py-3">{String(item.status ?? "—")}</td>
                    </tr>
                  );
                })}
                {!items.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#64748B]">
                      尚無資料 — 可透過 API POST /api/store 或 Excel Import 寫入
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
