"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Heart, Package, ShieldCheck, Star, Truck } from "lucide-react";
import {
  DEFAULT_SHOP_FEATURES,
  isExternalShopFeatureLink,
  type ShopFeature,
} from "@/lib/shop/features";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  truck: Truck,
  shield: ShieldCheck,
  gift: Gift,
  package: Package,
  star: Star,
  heart: Heart,
} as const;

function FeatureIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name as keyof typeof ICON_MAP] ?? Truck;
  return <Icon className="h-6 w-6 text-[#153E73] md:h-7 md:w-7" strokeWidth={1.75} aria-hidden />;
}

/**
 * Shop home 3 feature blocks — no section title.
 * Desktop & mobile: single row of 3.
 */
export function ShopFeatureBlocks({
  features: featuresProp,
  className,
}: {
  features?: ShopFeature[];
  className?: string;
}) {
  const [features, setFeatures] = useState<ShopFeature[]>(
    featuresProp ?? DEFAULT_SHOP_FEATURES
  );

  useEffect(() => {
    if (featuresProp) {
      setFeatures(featuresProp);
      return;
    }
    let cancelled = false;
    fetch("/api/shop/features", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d.features) && d.features.length) {
          setFeatures(d.features);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [featuresProp]);

  const visible = features
    .filter((f) => f.is_active !== false)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 3);

  if (!visible.length) return null;

  return (
    <section
      className={cn("w-full bg-white", className)}
      aria-label="商城特色"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-3 gap-2 px-4 md:gap-4 md:px-6">
        {visible.map((item) => {
          const href = (item.link_url || "/").trim() || "/";
          const external = isExternalShopFeatureLink(href, item.link_type);
          const inner = (
            <>
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 md:mb-3 md:h-11 md:w-11">
                <FeatureIcon name={item.icon} />
              </div>
              <p className="text-[11px] font-bold leading-snug text-[#153E73] md:text-sm">
                {item.title}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-[#687386] md:mt-1 md:text-xs">
                {item.subtitle}
              </p>
            </>
          );
          const boxClass = cn(
            "flex min-h-[88px] flex-col items-start rounded-2xl p-2.5 transition",
            "hover:-translate-y-0.5 active:scale-[0.99] md:min-h-[108px] md:p-4"
          );

          if (external) {
            return (
              <a
                key={item.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={boxClass}
                style={{ backgroundColor: item.background_color || "#E8F3FF" }}
              >
                {inner}
              </a>
            );
          }

          return (
            <Link
              key={item.id}
              href={href}
              className={boxClass}
              style={{ backgroundColor: item.background_color || "#E8F3FF" }}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
