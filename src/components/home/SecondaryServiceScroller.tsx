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
}> = [
  {
    href: "/ai-tools",
    title: "AI 烘焙助手",
    description: "不知道怎麼選？問問我",
    icon: Sparkles,
    iconClass: "text-primary",
  },
  {
    href: "/store-map",
    title: "門市地圖",
    description: "快速找到商品位置",
    icon: MapPin,
    iconClass: "text-caramel",
  },
  {
    href: "/news",
    title: "最新資訊",
    description: "新品與活動公告",
    icon: Newspaper,
    iconClass: "text-primary",
  },
  {
    href: "/support",
    title: "門市客服",
    description: "訂單與配送問題",
    icon: Headphones,
    iconClass: "text-caramel",
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
                "flex h-[76px] w-[158px] shrink-0 items-center gap-2.5 rounded-2xl border border-border-soft bg-surface px-3 shadow-card transition",
                "active:bg-peach-soft md:h-auto md:min-h-[84px] md:w-auto md:hover:-translate-y-0.5 md:hover:bg-peach-soft md:hover:shadow-lift"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cream-light",
                  item.iconClass
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-caramel">{item.title}</span>
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
