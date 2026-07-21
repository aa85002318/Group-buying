import Link from "next/link";
import {
  BadgeCheck,
  ChefHat,
  MapPin,
  Newspaper,
  Package,
  Percent,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/site-links";

const PRIMARY_ACTIONS: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  well: string;
  iconClass: string;
}> = [
  {
    href: APP_ROUTES.shop,
    label: "烘焙材料",
    icon: Package,
    well: "bg-surface-peach",
    iconClass: "text-brand-primary",
  },
  {
    href: "/group-buy",
    label: "團購",
    icon: Users,
    well: "bg-surface-coral",
    iconClass: "text-brand-primary",
  },
  {
    href: APP_ROUTES.recipes,
    label: "食譜影音",
    icon: ChefHat,
    well: "bg-surface-yellow",
    iconClass: "text-brand-caramel",
  },
  {
    href: APP_ROUTES.member,
    label: "會員中心",
    icon: BadgeCheck,
    well: "bg-surface-peach",
    iconClass: "text-brand-caramel",
  },
  {
    href: APP_ROUTES.aiTools,
    label: "AI助手",
    icon: Sparkles,
    well: "bg-surface-coral",
    iconClass: "text-brand-caramel",
  },
  {
    href: APP_ROUTES.storeMap,
    label: "門市地圖",
    icon: MapPin,
    well: "bg-surface-yellow",
    iconClass: "text-brand-primary",
  },
  {
    href: "/shop?promo=1",
    label: "優惠活動",
    icon: Percent,
    well: "bg-surface-coral",
    iconClass: "text-brand-primary",
  },
  {
    href: APP_ROUTES.news,
    label: "最新消息",
    icon: Newspaper,
    well: "bg-surface-yellow",
    iconClass: "text-brand-caramel",
  },
];

/** 八大快捷入口 — 4×2（桌機可 8 欄） */
export function PrimaryQuickActions({ loading }: { loading?: boolean }) {
  if (loading) {
    return (
      <section aria-busy aria-label="快捷入口">
        <ul className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="home-skeleton h-[104px] rounded-[18px]" />
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section aria-label="快捷入口">
      <ul className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-8">
        {PRIMARY_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href + item.label}>
              <Link
                href={item.href}
                className={cn(
                  "group flex flex-col items-center gap-1.5 rounded-[18px] border border-border-soft bg-surface p-2",
                  "shadow-[0_4px_12px_rgba(138,90,52,0.04)] transition duration-[180ms] ease-out",
                  "hover:-translate-y-0.5 hover:border-peach hover:bg-surface-soft",
                  "active:scale-[0.98]"
                )}
              >
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-[18px] transition duration-200 group-hover:scale-105",
                    item.well,
                    item.iconClass
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="line-clamp-2 max-w-full text-center text-[12px] font-semibold leading-tight text-brand-caramel sm:text-[13px]">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
