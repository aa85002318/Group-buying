"use client";

import {
  BookOpen,
  Box,
  ChefHat,
  CookingPot,
  Egg,
  Headphones,
  MapPin,
  Milk,
  Package,
  Refrigerator,
  ShieldCheck,
  Snowflake,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Wheat,
  ChocolateBar: Package,
  Milk,
  Package,
  Egg,
  Box,
  CookingPot,
  Snowflake,
  Refrigerator,
  ShieldCheck,
  MapPin,
  Headphones,
  BookOpen,
  ChefHat,
};

export type TrustServiceItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
};

const DEFAULT_ITEMS: TrustServiceItem[] = [
  { id: "quality", title: "嚴選原料", subtitle: "品質把關", icon: "ShieldCheck" },
  { id: "pickup", title: "門市取貨", subtitle: "方便安心", icon: "MapPin" },
  { id: "support", title: "專人客服", subtitle: "烘焙諮詢", icon: "Headphones" },
  { id: "fresh", title: "冷藏配送", subtitle: "新鮮直送", icon: "Snowflake" },
];

export function parseTrustServices(
  config: Record<string, unknown> | null | undefined
): TrustServiceItem[] {
  const raw = config?.items;
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_ITEMS;
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = String(row.title ?? "").trim();
      if (!title) return null;
      return {
        id: String(row.id ?? `trust-${index}`),
        title,
        subtitle: row.subtitle ? String(row.subtitle) : undefined,
        icon: row.icon ? String(row.icon) : "ShieldCheck",
      };
    })
    .filter(Boolean) as TrustServiceItem[];
}

export function TrustServicesSection({
  title = "安心服務",
  subtitle,
  items,
}: {
  title?: string;
  subtitle?: string | null;
  items?: TrustServiceItem[];
}) {
  const list = items && items.length > 0 ? items : DEFAULT_ITEMS;
  return (
    <section aria-label={title} className="space-y-3">
      <SectionHeader title={title} className="!mb-0" />
      {subtitle ? <p className="text-xs text-foreground-secondary">{subtitle}</p> : null}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {list.map((item) => {
          const Icon = ICON_MAP[item.icon || ""] || ShieldCheck;
          return (
            <li
              key={item.id}
              className={cn(
                "flex flex-col items-center gap-2 rounded-[16px] border border-border bg-surface px-3 py-4 text-center"
              )}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#FFE8E2] text-[#FF6B5B]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-bold text-brand-caramel">{item.title}</span>
              {item.subtitle ? (
                <span className="text-[11px] text-foreground-secondary">{item.subtitle}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CategoryLucideIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && ICON_MAP[name]) || Wheat;
  return <Icon className={className} aria-hidden />;
}

export { ICON_MAP as HOME_LUCIDE_ICON_MAP };
