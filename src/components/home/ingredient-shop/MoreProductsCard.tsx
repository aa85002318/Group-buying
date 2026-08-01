"use client";

import Link from "next/link";
import { ArrowUpRight, Grid2X2 } from "lucide-react";
import {
  PRODUCT_RAIL_CARD_HEIGHT,
  PRODUCT_RAIL_CARD_WIDTH,
} from "@/lib/ui/product-rail";

type MoreProductsCardProps = {
  title?: string;
  subtitle?: string;
  href: string;
};

export function MoreProductsCard({
  title = "更多商品",
  subtitle = "查看全部",
  href,
}: MoreProductsCardProps) {
  return (
    <Link
      href={href}
      className={`ingredient-shop-card ingredient-shop-more-card group relative flex shrink-0 snap-start flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#E9EDF2] bg-[#EEF8FC] p-2.5 shadow-[0_5px_16px_rgba(21,62,115,0.05)] transition duration-300 md:p-3 md:hover:-translate-y-0.5 md:hover:shadow-[0_8px_20px_rgba(21,62,115,0.08)] ${PRODUCT_RAIL_CARD_HEIGHT} ${PRODUCT_RAIL_CARD_WIDTH}`}
    >
      <div className="mb-3 inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white text-[#79C7E8] shadow-sm md:h-16 md:w-16">
        <Grid2X2 className="h-6 w-6 md:h-7 md:w-7" aria-hidden />
      </div>
      <h3 className="text-base font-bold text-[#153E73] md:text-lg">{title}</h3>
      <p className="mt-0.5 text-xs text-[#687386] md:text-sm">{subtitle}</p>
      <span className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#153E73] text-white transition group-hover:scale-105 md:h-9 md:w-9">
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </span>
    </Link>
  );
}
