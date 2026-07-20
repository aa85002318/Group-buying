import {
  BadgeCheck,
  ChefHat,
  Headphones,
  MapPin,
  Newspaper,
  Package,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  SERVICE_HUB_ITEMS,
  type ServiceHubIconName,
  type ServiceHubItem,
} from "@/lib/consumer-hub";
import { cn } from "@/lib/utils";

const ICONS: Record<ServiceHubIconName, LucideIcon> = {
  package: Package,
  chefHat: ChefHat,
  badge: BadgeCheck,
  users: Users,
  newspaper: Newspaper,
  headphones: Headphones,
  sparkles: Sparkles,
  mapPin: MapPin,
};

/** V1: white cards + soft icon wells (no loud saturated card fills) */
const HUB_ICON: Record<string, { well: string; icon: string }> = {
  shop: { well: "bg-primary-soft", icon: "text-primary" },
  recipes: { well: "bg-butter-soft", icon: "text-caramel" },
  member: { well: "bg-caramel-soft", icon: "text-caramel" },
  groupBuy: { well: "bg-groupBuy-soft", icon: "text-groupBuy" },
  news: { well: "bg-peach-soft", icon: "text-primary" },
  support: { well: "bg-surface-warm", icon: "text-caramel" },
  aiTools: { well: "bg-primary-soft", icon: "text-primary" },
  storeMap: { well: "bg-butter-soft", icon: "text-caramel" },
};

export function ServiceHubCard({ item }: { item: ServiceHubItem }) {
  const Icon = ICONS[item.icon];
  const style = HUB_ICON[item.id] ?? HUB_ICON.shop;

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex min-h-[108px] flex-col justify-between rounded-card border border-border-soft bg-surface p-4 shadow-card transition duration-250 ease-brand",
        "hover:border-primary hover:bg-peach-soft active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      )}
      aria-label={`${item.title}：${item.description}`}
    >
      <span
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-2xl transition group-hover:bg-peach-soft",
          style.well,
          style.icon,
          "group-hover:text-primary"
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <span>
        <span className="block text-sm font-bold text-foreground">{item.title}</span>
        <span className="mt-0.5 block text-[11px] font-medium leading-snug text-foreground-secondary">
          {item.description}
        </span>
      </span>
    </Link>
  );
}

export function ServiceHubGrid({ items = SERVICE_HUB_ITEMS }: { items?: ServiceHubItem[] }) {
  return (
    <section aria-label="八大服務入口">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-caramel">探索 CHIMEIDIY</h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            買材料 · 看食譜 · 用會員 · 參加團購
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => (
          <ServiceHubCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
