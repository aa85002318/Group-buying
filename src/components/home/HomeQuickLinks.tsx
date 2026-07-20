import Link from "next/link";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";

const LINKS: Array<{ href: string; label: string; icon: BrandIconName }> = [
  { href: "/ai", label: "AI助手", icon: "articles" },
  { href: "/group-buy", label: "團購", icon: "groupBuy" },
  { href: "/live", label: "直播", icon: "live" },
  { href: "/courses", label: "課程", icon: "courses" },
  { href: "/corporate", label: "企業", icon: "member" },
  { href: "/products", label: "商品", icon: "products" },
  { href: "/member/favorites", label: "收藏", icon: "favorites" },
  { href: "/member/carrier", label: "發票", icon: "carrier" },
  { href: "/stores", label: "門市", icon: "stores" },
  { href: "/support", label: "客服", icon: "support" },
];

export function HomeQuickLinks() {
  return (
    <section className="rounded-[22px] bg-card p-4 shadow-card">
      <div className="grid grid-cols-5 gap-3">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1.5 transition duration-250 ease-brand hover:-translate-y-0.5"
          >
            <BrandIcon name={item.icon} size="md" />
            <span className="text-[11px] font-bold text-coffee">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
