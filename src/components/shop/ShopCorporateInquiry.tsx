"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SHOP_INFO_BANNERS,
  type ShopInfoBanner,
} from "@/lib/shop/info-banners";

/**
 * Shop home — corporate inquiry 5:2 banner (CMS-backed).
 */
export function ShopCorporateInquiry({ className }: { className?: string }) {
  const [banner, setBanner] = useState<ShopInfoBanner>(
    DEFAULT_SHOP_INFO_BANNERS.corporate
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shop/info-banners", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.corporate?.image_url) setBanner(d.corporate);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const href = (banner.link_url || "/contact/business").trim() || "/contact/business";
  const external = /^https?:\/\//i.test(href);
  const img = (
    <span className="relative block aspect-[5/2] w-full overflow-hidden rounded-[16px] bg-transparent">
      <Image
        src={banner.image_url}
        alt={banner.alt_text || banner.title || "企業訂購詢問"}
        fill
        className="object-cover object-center"
        sizes="(max-width:1200px) 100vw, 1200px"
        priority={false}
      />
    </span>
  );

  return (
    <section className={cn("w-full bg-white", className)} aria-label="企業訂購詢問">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        {external ? (
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={banner.title}>
            {img}
          </a>
        ) : (
          <Link href={href} aria-label={banner.title || "企業訂購詢問，立即聯繫"}>
            {img}
          </Link>
        )}
      </div>
    </section>
  );
}
