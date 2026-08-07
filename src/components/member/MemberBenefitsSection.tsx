"use client";

import Link from "next/link";
import {
  GiftCampaignCard,
  type GiftCampaignCardData,
} from "@/components/member/gifts/GiftCampaignCard";
import { MemberEmptyState } from "@/components/member/MemberEmptyState";
import { APP_ROUTES } from "@/lib/site-links";

const MONTHLY_TYPES = new Set([
  "monthly_member_gift",
  "birthday_gift",
  "new_member_gift",
]);

export function MemberBenefitsSection({
  campaigns,
  claimingId,
  onClaim,
}: {
  campaigns: GiftCampaignCardData[];
  claimingId: string | null;
  onClaim: (
    campaignId: string,
    opts?: { store_id?: string; gift_item_id?: string }
  ) => void;
}) {
  const monthly = campaigns.filter((c) => MONTHLY_TYPES.has(c.campaign_type));
  const spend = campaigns.filter((c) => c.campaign_type === "store_spend_gift");
  const cards = [...monthly, ...spend];

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-2 px-0.5">
        <div>
          <h2 className="text-base font-bold text-[#153E73]">本月會員好康</h2>
          <p className="mt-0.5 text-xs text-[#687386]">會員禮與門市滿額贈</p>
        </div>
        <Link href={APP_ROUTES.memberBenefits} className="text-xs font-semibold text-[#79C7E8]">
          查看全部
        </Link>
      </div>

      {cards.length === 0 ? (
        <MemberEmptyState message="目前沒有進行中的會員好康" />
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cards.map((item) => (
            <div key={item.id} className="w-[260px] shrink-0">
              <GiftCampaignCard
                item={item}
                compact
                onClaim={onClaim}
                claiming={claimingId === item.id}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
