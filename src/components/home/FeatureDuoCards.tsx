"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DEFAULT_HOME_FEATURE_DUO_ITEMS,
  type HomeFeatureDuoItem,
} from "@/lib/home/feature-duo";
import { cn } from "@/lib/utils";

/** 快捷選單下方雙卡：滿版圖片、無漸層、無箭頭、圖上不放文字 */
export function FeatureDuoCards({ className }: { className?: string }) {
  const [items, setItems] = useState<HomeFeatureDuoItem[]>(DEFAULT_HOME_FEATURE_DUO_ITEMS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/home-feature-duo")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const next = (d.items as HomeFeatureDuoItem[] | undefined) ?? [];
        if (next.length > 0) setItems(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = items.filter((i) => i.is_active).slice(0, 2);

  return (
    <section
      aria-label="功能推薦"
      className={cn("grid grid-cols-1 gap-3 min-[375px]:grid-cols-2", className)}
    >
      {visible.map((item) => {
        const external = item.link_target === "_blank";
        const imgSrc = item.image_url || "/branding/feature-duo-ai.png";
        return (
          <Link
            key={item.id}
            href={item.link_url}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            aria-label={item.alt_text || item.title}
            className="relative block h-[108px] min-w-0 overflow-hidden rounded-[18px] bg-surface-soft transition duration-[180ms] hover:-translate-y-0.5 active:scale-[0.99] min-[375px]:h-[112px] sm:h-[120px]"
          >
            <Image
              src={imgSrc}
              alt=""
              fill
              sizes="(min-width: 375px) 50vw, 100vw"
              className="object-cover"
              unoptimized
            />
          </Link>
        );
      })}
    </section>
  );
}
