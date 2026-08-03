"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DEFAULT_SHOP_FEATURES,
  isExternalShopFeatureLink,
  type ShopFeature,
} from "@/lib/shop/features";
import { cn } from "@/lib/utils";

/**
 * Shop home 3 feature blocks — banner images only, no section title.
 * Desktop & mobile: single row of 3. Slots without image_url are skipped.
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
    .filter((f) => f.is_active !== false && Boolean(f.image_url?.trim()))
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 3);

  if (!visible.length) return null;

  return (
    <section className={cn("w-full bg-white", className)} aria-label="商城特色">
      <div className="mx-auto grid max-w-[1200px] grid-cols-3 gap-2 px-4 md:gap-4 md:px-6">
        {visible.map((item) => {
          const href = (item.link_url || "/").trim() || "/";
          const external = isExternalShopFeatureLink(href, item.link_type);
          const alt = item.title?.trim() || item.subtitle?.trim() || "商城特色";
          const img = (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-[#F7F8FB] md:aspect-[5/3]">
              <Image
                src={item.image_url!}
                alt={alt}
                fill
                className="object-cover object-center transition duration-200 group-hover:scale-[1.02]"
                sizes="(max-width:768px) 33vw, 380px"
              />
            </div>
          );

          if (external) {
            return (
              <a
                key={item.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block min-w-0"
                aria-label={alt}
              >
                {img}
              </a>
            );
          }

          return (
            <Link
              key={item.id}
              href={href}
              className="group block min-w-0"
              aria-label={alt}
            >
              {img}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
