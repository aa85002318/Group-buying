"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GIFT_CAMPAIGN_TYPE_LABEL } from "@/lib/gifts/types";

type CampaignRow = {
  id: string;
  name: string;
  gift_name: string;
  campaign_type: "monthly_member_gift" | "store_spend_gift";
  status: string;
  total_quantity: number;
  reserved_quantity: number;
  redeemed_quantity: number;
  available_quantity: number;
  claim_start_at?: string | null;
  claim_end_at?: string | null;
};

export default function AdminMemberGiftsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    gift_name: "",
    campaign_type: "monthly_member_gift",
    total_quantity: "100",
    per_member_limit: "1",
    status: "draft",
  });

  const load = () => {
    setLoading(true);
    fetch("/api/admin/member-gifts")
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/member-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          total_quantity: Number(form.total_quantity),
          per_member_limit: Number(form.per_member_limit),
          claim_start_at: new Date().toISOString(),
          claim_end_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          redeem_end_at: new Date(Date.now() + 35 * 86400000).toISOString(),
          inventory_reservation_mode: "reserve_on_claim",
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "建立失敗");
      setForm({
        name: "",
        gift_name: "",
        campaign_type: "monthly_member_gift",
        total_quantity: "100",
        per_member_limit: "1",
        status: "draft",
      });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "建立失敗");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="會員禮管理"
        description="本月會員禮與門市滿額贈活動、庫存與核銷紀錄"
      />

      <section className="rounded-2xl border border-[#E7EAF0] bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-[#153E73]">快速建立活動</h2>
        <div className="grid gap-2 md:grid-cols-3">
          <Input
            placeholder="活動名稱"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            placeholder="禮品名稱"
            value={form.gift_name}
            onChange={(e) => setForm((f) => ({ ...f, gift_name: e.target.value }))}
          />
          <select
            className="input-field"
            value={form.campaign_type}
            onChange={(e) =>
              setForm((f) => ({ ...f, campaign_type: e.target.value }))
            }
          >
            <option value="monthly_member_gift">本月會員禮</option>
            <option value="store_spend_gift">門市滿額贈</option>
          </select>
          <Input
            placeholder="總數量"
            value={form.total_quantity}
            onChange={(e) => setForm((f) => ({ ...f, total_quantity: e.target.value }))}
          />
          <Input
            placeholder="每人上限"
            value={form.per_member_limit}
            onChange={(e) => setForm((f) => ({ ...f, per_member_limit: e.target.value }))}
          />
          <select
            className="input-field"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="draft">草稿</option>
            <option value="published">已發布</option>
            <option value="paused">已暫停</option>
            <option value="ended">已結束</option>
          </select>
        </div>
        <Button className="mt-3" disabled={creating} onClick={() => void create()}>
          {creating ? "建立中…" : "建立活動"}
        </Button>
      </section>

      <div className="overflow-hidden rounded-2xl border border-[#E7EAF0] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FFFDF6] text-[11px] uppercase text-[#8A94A6]">
            <tr>
              <th className="px-3 py-2">活動</th>
              <th className="px-3 py-2">類型</th>
              <th className="px-3 py-2">庫存</th>
              <th className="px-3 py-2">狀態</th>
              <th className="px-3 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-[#8A94A6]">
                  載入中…
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-[#8A94A6]">
                  尚無活動。請先套用 migration 後建立。
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[#153E73]">{c.name}</p>
                    <p className="text-xs text-[#8A94A6]">{c.gift_name}</p>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {GIFT_CAMPAIGN_TYPE_LABEL[c.campaign_type]}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    總 {c.total_quantity}／保留 {c.reserved_quantity}／已兌{" "}
                    {c.redeemed_quantity}／剩 {c.available_quantity}
                  </td>
                  <td className="px-3 py-3 text-xs">{c.status}</td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/admin/member-gifts/${c.id}`}
                      className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                    >
                      編輯／紀錄
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
