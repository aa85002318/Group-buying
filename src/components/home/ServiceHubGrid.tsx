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

/** App V1 soft tones — unified brand, not eight loud colors */
const HUB_STYLE: Record<
  string,
  { wrap: string; icon: string }
> = {
  shop: { wrap: "bg-primary-soft", icon: "text-primary" },
  recipes: { wrap: "bg-butter-soft", icon: "text-caramel" },
  member: { wrap: "bg-caramel-soft", icon: "text-caramel" },
  groupBuy: { wrap: "bg-groupBuy-soft", icon: "text-groupBuy" },
  news: { wrap: "bg-peach-soft", icon: "text-primary" },
  support: { wrap: "bg-surface-soft", icon: "text-caramel" },
  aiTools: { wrap: "bg-primary-soft", icon: "text-primary" },
  storeMap: { wrap: "bg-butter-soft", icon: "text-caramel" },
};

export function ServiceHubCard({ item }: { item: ServiceHubItem }) {
  const Icon = ICONS[item.icon];
  const style = HUB_STYLE[item.id] ?? HUB_STYLE.shop;

  return (
    <Link
      href={item.href}
      className="group flex min-h-[70px] min-w-0 flex-col items-center gap-1 rounded-2xl p-0.5 transition active:bg-peach focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:min-h-[74px] sm:gap-1.5 sm:p-1"
      aria-label={item.title}
    >
      <span
        className={cn(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition group-hover:bg-peach group-active:bg-peach sm:h-12 sm:w-12 md:h-[52px] md:w-[52px]",
          style.wrap
        )}
      >
        <Icon
          className={cn("h-5 w-5 sm:h-6 sm:w-6 group-hover:text-primary", style.icon)}
          aria-hidden
        />
      </span>
      <span className="line-clamp-2 max-w-full break-words text-center text-[11px] font-semibold leading-tight text-foreground sm:text-[12px] md:text-[13px]">
        {item.title}
      </span>
    </Link>
  );
}

export function ServiceHubGrid({ items = SERVICE_HUB_ITEMS }: { items?: ServiceHubItem[] }) {
  return (
    <section aria-label="八大功能入口" className="min-w-0">
      <div className="grid grid-cols-4 gap-0.5 sm:gap-2">
        {items.map((item) => (
          <ServiceHubCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
