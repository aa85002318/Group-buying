import Link from "next/link";

const HERO_IMAGE = "/images/mall/hero-banner.jpg";

const SHORTCUTS = [
  {
    id: "new",
    label: "今日新品",
    href: "/baking-materials?sort=newest",
  },
  {
    id: "group-buy",
    label: "團購優惠",
    href: "/group-buy",
  },
  {
    id: "pickup",
    label: "門市取貨",
    href: "/stores",
  },
  {
    id: "ai",
    label: "AI 找商品",
    href: "/ai",
  },
] as const;

/**
 * 商城頁 Hero Banner — full-bleed art + tappable shortcut hotspots
 * over the baked-in shortcut strip (今日新品／團購／門市／AI).
 */
export function MallHeroBanner() {
  return (
    <section className="mall-hero-banner" aria-label="烘焙好物商城">
      <div className="mall-hero-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt="烘焙好物商城：精選超過 4,000 項商品，材料、器具、包裝一次購足"
          className="mall-hero-img"
          width={1000}
          height={500}
          fetchPriority="high"
          decoding="async"
        />

        <nav className="mall-hero-shortcuts" aria-label="商城快捷入口">
          {SHORTCUTS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="mall-hero-shortcut"
              aria-label={item.label}
            >
              <span className="sr-only">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
