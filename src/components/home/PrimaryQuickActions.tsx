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
    label: "AI 助手",
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

/** 示意圖 4×2：高 82–96、Icon 52–56、無長說明 */
export function PrimaryQuickActions() {
  return (
    <section aria-label="快捷入口">
      <ul className="grid grid-cols-4 gap-x-2.5 gap-y-3">
        {PRIMARY_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href + item.label}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-[90px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border-soft bg-surface px-1",
                  "transition duration-[180ms] hover:-translate-y-0.5 active:scale-[0.98]"
                )}
              >
                <span
                  className={cn(
                    "flex h-[52px] w-[52px] items-center justify-center rounded-2xl",
                    item.well,
                    item.iconClass
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="line-clamp-2 max-w-full text-center text-[12px] font-semibold leading-tight text-brand-caramel">
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
