import type { GroupBuyPageSettings } from "@/lib/group-buy/page-settings";
import type { GroupBuyCampaignCardData } from "@/components/group-buy/GroupBuyCampaignCard";
import { GroupBuyProductCard } from "@/components/group-buy/GroupBuyProductCard";

export function GroupBuyProductGrid({
  campaigns,
  settings,
  onExpire,
}: {
  campaigns: GroupBuyCampaignCardData[];
  settings: GroupBuyPageSettings;
  onExpire?: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6">
      {campaigns.map((c) => (
        <GroupBuyProductCard
          key={c.id}
          campaign={c}
          settings={settings}
          onExpire={onExpire}
        />
      ))}
    </div>
  );
}
