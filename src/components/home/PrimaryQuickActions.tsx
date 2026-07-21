import Link from "next/link";
import {
  BadgeCheck,
  ChefHat,
  Package,
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
    href: APP_ROUTES.recipes,
    label: "食譜影音",
    icon: ChefHat,
    well: "bg-surface-yellow",
    iconClass: "text-brand-caramel",
  },
  {
    href: "/group-buy",
    label: "團購專區",
    icon: Users,
    well: "bg-surface-coral",
    iconClass: "text-brand-primary",
  },
  {
    href: APP_ROUTES.member,
    label: "我的會員",
    icon: BadgeCheck,
    well: "bg-surface-peach",
    iconClass: "text-brand-caramel",
  },
];

/** Four high-frequency shortcuts — mall-app style, not dashboard cards */
export function PrimaryQuickActions() {
  return (
    <section aria-label="主要快捷入口">
      {/* Mobile: 4-column icon grid */}
      <ul className="grid grid-cols-4 gap-2 md:hidden">
        {PRIMARY_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-2 transition hover:bg-peach-light active:bg-surface-peach"
              >
                <span
                  className={cn(
                    "flex h-[52px] w-[52px] items-center justify-center rounded-[18px]",
                    item.well,
                    item.iconClass
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="max-w-full truncate text-[13px] font-medium text-caramel">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: four horizontal cards with short copy */}
      <ul className="hidden gap-3 md:grid md:grid-cols-4">
        {PRIMARY_ACTIONS.map((item) => {
          const Icon = item.icon;
          const blurb =
            item.label === "烘焙材料"
              ? "原料、器具一次購足"
              : item.label === "食譜影音"
                ? "教學與短影音"
                : item.label === "團購專區"
                  ? "限時開團與收單"
                  : "條碼、載具與訂單";
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex min-h-[88px] items-center gap-3 rounded-[20px] border border-border bg-surface p-4 shadow-soft transition duration-250 hover:-translate-y-0.5 hover:border-brand-peach hover:bg-peach-light hover:shadow-lift"
              >
                <span
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px]",
                    item.well,
                    item.iconClass
                  )}
                >
                  <Icon className="h-7 w-7" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-caramel group-hover:text-primary">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-sm text-foreground-secondary">{blurb}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
