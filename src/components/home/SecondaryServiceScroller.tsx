import Link from "next/link";
import {
  Headphones,
  MapPin,
  Newspaper,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECONDARY: Array<{
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  well: string;
  cardClass?: string;
}> = [
  {
    href: "/ai-tools",
    title: "AI 烘焙助手",
    description: "不知道怎麼選？問問我",
    icon: Sparkles,
    iconClass: "text-brand-primary",
    well: "bg-surface",
    cardClass: "bg-ai-gradient",
  },
  {
    href: "/store-map",
    title: "門市地圖",
    description: "快速找到商品位置",
    icon: MapPin,
    iconClass: "text-brand-primary",
    well: "bg-surface",
    cardClass: "bg-store-gradient",
  },
  {
    href: "/news",
    title: "最新資訊",
    description: "新品與活動公告",
    icon: Newspaper,
    iconClass: "text-brand-primary",
    well: "bg-surface-yellow",
  },
  {
    href: "/support",
    title: "門市客服",
    description: "訂單與配送問題",
    icon: Headphones,
    iconClass: "text-brand-caramel",
    well: "bg-surface-peach",
  },
];

/** Horizontal mini service cards — secondary hub entries */
export function SecondaryServiceScroller() {
  return (
    <section aria-label="更多服務">
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
        {SECONDARY.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-[76px] w-[158px] shrink-0 items-center gap-2.5 rounded-[20px] border border-border bg-surface px-3 shadow-soft transition",
                "hover:border-brand-peach hover:bg-peach-light active:bg-surface-peach",
                "md:h-auto md:min-h-[84px] md:w-auto md:hover:-translate-y-0.5 md:hover:shadow-lift",
                item.cardClass
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                  item.well,
                  item.iconClass
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-brand-caramel">
                  {item.title}
                </span>
                <span className="mt-0.5 block line-clamp-1 text-xs text-foreground-secondary">
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
