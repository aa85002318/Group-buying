"use client";

import Link from "next/link";
import { ArrowUpRight, Grid2X2 } from "lucide-react";

type MoreProductsCardProps = {
  title?: string;
  subtitle?: string;
  href: string;
};

export function MoreProductsCard({
  title = "更多商品",
  subtitle = "查看更多烘焙材料",
  href,
}: MoreProductsCardProps) {
  return (
    <Link
      href={href}
      className="ingredient-shop-card ingredient-shop-more-card group relative flex w-[78vw] max-w-[280px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[20px] border border-[#E9EDF2] p-5 shadow-[0_8px_24px_rgba(21,62,115,0.06)] transition duration-300 md:w-[270px] md:max-w-none md:hover:-translate-y-0.5 md:hover:shadow-[0_12px_28px_rgba(21,62,115,0.1)]"
      style={{
        background: "linear-gradient(180deg, #EEF8FC 0%, #FFFFFF 100%)",
        minHeight: "100%",
      }}
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-[#79C7E8] shadow-sm">
          <Grid2X2 className="h-7 w-7" aria-hidden />
        </div>
        <h3 className="text-lg font-bold text-[#153E73]">{title}</h3>
        <p className="mt-1 text-sm text-[#687386]">{subtitle}</p>
      </div>
      <span className="absolute bottom-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#153E73] text-white transition group-hover:scale-105">
        <ArrowUpRight className="h-5 w-5" aria-hidden />
      </span>
    </Link>
  );
}
