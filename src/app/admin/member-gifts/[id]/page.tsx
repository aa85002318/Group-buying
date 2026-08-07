"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminMemberGiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Record<string, unknown> | null>(null);
  const [claims, setClaims] = useState<Array<Record<string, unknown>>>([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch(`/api/admin/member-gifts/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setCampaign(d.campaign ?? null);
        setClaims(d.claims ?? []);
      });
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    if (!campaign) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/member-gifts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaign),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setCampaign(d.campaign);
      alert("已儲存");
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (!campaign) {
    return <p className="p-6 text-sm text-[#8A94A6]">載入中…</p>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={String(campaign.name ?? "活動編輯")}
        description="編輯活動設定並查看領取／核銷紀錄"
      />
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/member-gifts" className="text-sm text-[#153E73] underline">
          ← 返回列表
        </Link>
        <a
          href={`/api/admin/member-gifts/${id}/export`}
          className="text-sm text-[#153E73] underline"
        >
          匯出 CSV
        </a>
      </div>

      <section className="grid gap-3 rounded-2xl border border-[#E7EAF0] bg-white p-4 md:grid-cols-2">
        <label className="text-xs">
          活動名稱
          <Input
            className="mt-1"
            value={String(campaign.name ?? "")}
            onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
          />
        </label>
        <label className="text-xs">
          禮品名稱
          <Input
            className="mt-1"
            value={String(campaign.gift_name ?? "")}
            onChange={(e) => setCampaign({ ...campaign, gift_name: e.target.value })}
          />
        </label>
        <label className="text-xs">
          禮品圖片 URL
          <Input
            className="mt-1"
            value={String(campaign.gift_image_url ?? "")}
            onChange={(e) =>
              setCampaign({ ...campaign, gift_image_url: e.target.value })
            }
          />
        </label>
        <label className="text-xs">
          總數量
          <Input
            className="mt-1"
            type="number"
            value={String(campaign.total_quantity ?? 0)}
            onChange={(e) =>
              setCampaign({ ...campaign, total_quantity: Number(e.target.value) })
            }
          />
        </label>
        <label className="text-xs">
          最低消費（滿額贈）
          <Input
            className="mt-1"
            type="number"
            value={String(campaign.minimum_spend ?? "")}
            onChange={(e) =>
              setCampaign({
                ...campaign,
                minimum_spend: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </label>
        <label className="text-xs">
          狀態
          <select
            className="input-field mt-1"
            value={String(campaign.status ?? "draft")}
            onChange={(e) => setCampaign({ ...campaign, status: e.target.value })}
          >
            <option value="draft">草稿</option>
            <option value="published">已發布</option>
            <option value="paused">已暫停</option>
            <option value="ended">已結束</option>
          </select>
        </label>
        <label className="text-xs md:col-span-2">
          活動說明
          <textarea
            className="input-field mt-1 min-h-[80px]"
            value={String(campaign.description ?? "")}
            onChange={(e) =>
              setCampaign({ ...campaign, description: e.target.value })
            }
          />
        </label>
        <p className="text-xs text-[#8A94A6] md:col-span-2">
          庫存：保留 {String(campaign.reserved_quantity)}／已兌{" "}
          {String(campaign.redeemed_quantity)}／剩餘{" "}
          {String(campaign.available_quantity)}（預設領券時保留庫存）
        </p>
        <Button disabled={saving} onClick={() => void save()}>
          {saving ? "儲存中…" : "儲存"}
        </Button>
      </section>

      <section className="rounded-2xl border border-[#E7EAF0] bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-[#153E73]">領取／核銷紀錄</h2>
        <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
          {claims.length === 0 ? (
            <li className="text-[#8A94A6]">尚無紀錄</li>
          ) : (
            claims.map((c) => (
              <li key={String(c.id)} className="rounded-xl bg-[#FFFDF6] px-3 py-2">
                <p className="font-semibold text-[#153E73]">
                  {(c.profiles as { full_name?: string } | null)?.full_name ?? "會員"} ·{" "}
                  {String(c.status)}
                </p>
                <p className="text-xs text-[#8A94A6]">
                  {c.redemption_number ? `核銷號 ${String(c.redemption_number)} · ` : ""}
                  {c.redeemed_store_name_snapshot
                    ? String(c.redeemed_store_name_snapshot)
                    : "尚未核銷"}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
