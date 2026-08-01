import { Package, ShieldCheck, Star, Truck } from "lucide-react";

const FEATURES = [
  { id: "quality", title: "品質嚴選", subtitle: "安心有保障", Icon: ShieldCheck },
  { id: "ship", title: "快速出貨", subtitle: "天天出貨", Icon: Truck },
  { id: "pack", title: "安心包裝", subtitle: "完整不破損", Icon: Package },
  { id: "member", title: "會員優惠", subtitle: "專屬折扣", Icon: Star },
] as const;

/** Version A — frosted capsule feature strip under shop hero art. */
export function ShopHeroFeatureCapsules() {
  return (
    <ul className="shop-hero-capsules" aria-label="商城服務特色">
      {FEATURES.map(({ id, title, subtitle, Icon }) => (
        <li key={id} className="shop-hero-capsule">
          <span className="shop-hero-capsule__icon" aria-hidden>
            <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
          </span>
          <span className="shop-hero-capsule__copy">
            <span className="shop-hero-capsule__title">{title}</span>
            <span className="shop-hero-capsule__sub">{subtitle}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
