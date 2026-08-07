"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CampaignEditor } from "@/components/admin/member-gifts/CampaignEditor";

export default function AdminMemberGiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Record<string, unknown> | null>(null);
  const [claims, setClaims] = useState<Array<Record<string, unknown>>>([]);

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

  if (!campaign) {
    return <p className="p-6 text-sm text-[#8A94A6]">載入中…</p>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={String(campaign.name ?? "活動編輯")}
        description="條件組合、門市庫存、前台預覽與領取紀錄"
      />
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/member-gifts/campaigns" className="text-sm text-[#153E73] underline">
          ← 返回活動列表
        </Link>
        <a
          href={`/api/admin/member-gifts/${id}/export`}
          className="text-sm text-[#153E73] underline"
        >
          匯出 CSV
        </a>
      </div>

      <CampaignEditor
        campaignId={id}
        campaign={campaign}
        claims={claims}
        onCampaignChange={setCampaign}
        onSaved={(c) => {
          setCampaign(c);
          load();
        }}
      />
    </div>
  );
}
