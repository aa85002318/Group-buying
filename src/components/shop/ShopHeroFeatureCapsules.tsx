import { Package, ShieldCheck, Star, Truck } from "lucide-react";

const FEATURES = [
  { id: "quality", title: "品質嚴選", subtitle: "安心有保障", Icon: ShieldCheck },
  { id: "ship", title: "快速出貨", subtitle: "天天出貨", Icon: Truck },
  { id: "pack", title: "安心包裝", subtitle: "完整不破損", Icon: Package },
  { id: "member", title: "會員優惠", subtitle: "專屬折扣", Icon: Star },
] as const;

/**
 * Shop mall highlights — 2×2 white cards below category menu (not inside Hero).
 */
export function ShopHeroFeatureCapsules() {
  return (
    <section className="shop-mall-features" aria-label="商城服務特色">
      <ul className="shop-mall-features__grid">
        {FEATURES.map(({ id, title, subtitle, Icon }) => (
          <li key={id} className="shop-mall-features__card">
            <span className="shop-mall-features__icon" aria-hidden>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="shop-mall-features__copy">
              <span className="shop-mall-features__title">{title}</span>
              <span className="shop-mall-features__sub">{subtitle}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
