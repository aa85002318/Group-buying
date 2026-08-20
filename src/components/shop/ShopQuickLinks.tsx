"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Flame, Gift, Percent, ShoppingBag, Star, Tag } from "lucide-react";
import {
  liveShopQuickLinks,
  type ShopQuickLink,
  type ShopQuickLinkIconKey,
} from "@/lib/shop/quick-links";
import { isExternalHref } from "@/lib/shop/promo-banners";
import { cn } from "@/lib/utils";

const ICONS: Record<ShopQuickLinkIconKey, typeof Percent> = {
  percent: Percent,
  bag: ShoppingBag,
  flame: Flame,
  gift: Gift,
  star: Star,
  tag: Tag,
};

function QuickLinkIcon({ link }: { link: ShopQuickLink }) {
  const [failed, setFailed] = useState(false);
  const custom = link.icon_type === "custom_image" ? link.icon_image_url : null;
  if (custom && !failed) {
    return (
      <Image
        src={custom}
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 object-contain"
        onError={() => setFailed(true)}
      />
    );
  }
  const Icon = ICONS[link.icon_key] ?? Percent;
  return <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />;
}

/**
 * Shop home quick-entry row — max 4, hidden when empty.
 */
export function ShopQuickLinks({
  links: linksProp,
}: {
  links?: ShopQuickLink[];
}) {
  const [links, setLinks] = useState<ShopQuickLink[]>(() =>
    linksProp ? liveShopQuickLinks(linksProp) : []
  );
  const [loaded, setLoaded] = useState(Boolean(linksProp));

  useEffect(() => {
    if (linksProp) {
      setLinks(liveShopQuickLinks(linksProp));
      setLoaded(true);
      return;
    }
    let cancelled = false;
    fetch("/api/shop/quick-links", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const rows = Array.isArray(d.links) ? (d.links as ShopQuickLink[]) : [];
        setLinks(liveShopQuickLinks(rows));
      })
      .catch(() => {
        if (!cancelled) setLinks([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [linksProp]);

  if (!loaded || links.length === 0) return null;

  return (
    <section className="shop-quick-links w-full" aria-label="快捷入口">
      <div className="mx-auto flex w-full max-w-[1200px] gap-1.5 px-4 md:gap-2 md:px-6">
        {links.map((link) => {
          const href = link.target_url.trim() || "/";
          const external = link.target_type === "external_url" || isExternalHref(href);
          const className = cn(
            "relative flex min-h-[68px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[14px]",
            "border border-[#F3E7B8] bg-white px-1 py-2 text-center md:min-h-[76px]"
          );
          const inner = (
            <>
              {link.badge_text ? (
                <span
                  className="absolute right-1 top-1 rounded-[4px] px-1 py-px text-[9px] font-bold leading-none text-white"
                  style={{ backgroundColor: link.badge_color || "#F16458" }}
                >
                  {link.badge_text}
                </span>
              ) : null}
              <span style={{ color: link.text_color || "#153E73" }}>
                <QuickLinkIcon link={link} />
              </span>
              <span
                className="max-w-full truncate text-[12px] font-semibold leading-tight md:text-[13px]"
                style={{ color: link.text_color || "#153E73" }}
              >
                {link.title}
              </span>
            </>
          );

          if (external) {
            return (
              <a
                key={link.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                style={{ backgroundColor: link.background_color || "#FFFFFF" }}
              >
                {inner}
              </a>
            );
          }

          return (
            <Link
              key={link.id}
              href={href}
              className={className}
              style={{ backgroundColor: link.background_color || "#FFFFFF" }}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
