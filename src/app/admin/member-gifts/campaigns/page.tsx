"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GIFT_CAMPAIGN_STATUS_LABEL,
  GIFT_CAMPAIGN_TYPE_LABEL,
  type GiftCampaignStatus,
  type GiftCampaignType,
} from "@/lib/gifts/types";

type CampaignRow = {
  id: string;
  name: string;
  gift_name: string;
  campaign_code?: string | null;
  campaign_type: GiftCampaignType;
  status: GiftCampaignStatus;
  total_quantity: number;
  reserved_quantity: number;
  redeemed_quantity: number;
  available_quantity: number;
  show_on_frontend?: boolean;
};

export default function MemberGiftCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const setStatus = async (id: string, status: GiftCampaignStatus) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/member-gifts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "狀態更新失敗");
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "狀態更新失敗");
    } finally {
      setBusyId(null);
    }
  };

  const cloneCampaign = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/member-gifts/${id}/clone`, {
        method: "POST",
      });
      const d = await res.json();
      if (!res.ok && res.status !== 207) {
        throw new Error(d.error ?? "複製失敗");
      }
      if (d.campaign?.id) {
        router.push(`/admin/member-gifts/campaigns/${d.campaign.id}`);
        return;
      }
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "複製失敗");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="活動管理"
        description="建立每月會員禮、門市滿額贈與其他贈禮活動（獨立模組，不混用商品／優惠券庫存）"
        actions={
          <Link
            href="/admin/member-gifts/campaigns/new"
            className={cn(buttonVariants({ className: "bg-[#FEE169] font-bold text-[#153E73]" }))}
          >
            新增活動
          </Link>
        }
      />

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
                  尚無活動。請先建立活動並套用最新 migration。
                </td>
              </tr>
            ) : (
              campaigns.map((c) => {
                const busy = busyId === c.id;
                return (
                  <tr key={c.id}>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-[#153E73]">{c.name}</p>
                      <p className="text-xs text-[#8A94A6]">
                        {c.gift_name}
                        {c.campaign_code ? ` · ${c.campaign_code}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {GIFT_CAMPAIGN_TYPE_LABEL[c.campaign_type] ?? c.campaign_type}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      總 {c.total_quantity}／保留 {c.reserved_quantity}／已兌{" "}
                      {c.redeemed_quantity}／剩 {c.available_quantity}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {GIFT_CAMPAIGN_STATUS_LABEL[c.status] ?? c.status}
                      {c.show_on_frontend === false ? " · 前台隱藏" : ""}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {(c.status === "draft" ||
                          c.status === "scheduled" ||
                          c.status === "paused") && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void setStatus(c.id, "published")}
                          >
                            發布
                          </Button>
                        )}
                        {c.status === "published" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void setStatus(c.id, "paused")}
                          >
                            暫停
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void cloneCampaign(c.id)}
                        >
                          複製
                        </Button>
                        <Link
                          href={`/admin/member-gifts/campaigns/${c.id}`}
                          className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                        >
                          編輯
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
