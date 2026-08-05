"use client";

import type { GroupBuyPageSettings } from "@/lib/group-buy/page-settings";
import type { GroupBuyCampaignCardData } from "@/components/group-buy/GroupBuyCampaignCard";
import { GroupBuyProductCard } from "@/components/group-buy/GroupBuyProductCard";
import { GroupBuySectionHeader } from "@/components/group-buy/GroupBuySectionHeader";

export function ClosingSoonSection({
  campaigns,
  settings,
  onViewAll,
  onExpire,
}: {
  campaigns: GroupBuyCampaignCardData[];
  settings: GroupBuyPageSettings;
  onViewAll: () => void;
  onExpire?: () => void;
}) {
  if (!campaigns.length) return null;

  return (
    <section
      className="rounded-[20px] p-4 md:rounded-[24px] md:p-6"
      style={{ backgroundColor: "#FFF5CC" }}
      aria-label="快要結團囉"
    >
      <GroupBuySectionHeader
        title="快要結團囉！"
        actionLabel="查看全部"
        onAction={onViewAll}
      />
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {campaigns.map((c) => (
          <div
            key={`closing-${c.id}`}
            className="w-[168px] shrink-0 sm:w-[180px] md:w-[200px]"
          >
            <GroupBuyProductCard
              campaign={c}
              settings={settings}
              compact
              onExpire={onExpire}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
