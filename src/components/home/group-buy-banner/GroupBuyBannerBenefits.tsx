"use client";

import type { GroupBuyBannerBenefit } from "@/types/home-group-buy-banner";

export function GroupBuyBannerBenefits({
  benefits,
}: {
  benefits: GroupBuyBannerBenefit[];
}) {
  const list = benefits.filter((b) => b.enabled !== false).slice(0, 4);
  if (list.length === 0) return null;

  return (
    <ul className="group-buy-banner-benefits" aria-label="團購品牌優勢">
      {list.map((item) => (
        <li key={item.id} className="group-buy-banner-benefit">
          {item.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.iconUrl} alt="" width={32} height={32} draggable={false} />
          ) : null}
          <span className="group-buy-banner-benefit-text">
            <strong>{item.title}</strong>
            {item.subtitle ? <span>{item.subtitle}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
