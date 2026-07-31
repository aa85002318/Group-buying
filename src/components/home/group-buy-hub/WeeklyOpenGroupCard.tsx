"use client";

import Link from "next/link";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { formatCurrency, cn } from "@/lib/utils";
import {
  eventImage,
  eventPrices,
  primaryProduct,
  remainDaysLabel,
  soldCount,
  type GroupBuyHubEvent,
} from "./types";

const CARD =
  "gb-hub-open-card group flex h-[212px] w-[44vw] max-w-[150px] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] border border-[#E9EDF2] bg-white p-2 shadow-[0_4px_14px_rgba(21,62,115,0.05)] transition duration-300 md:h-[220px] md:w-[150px] md:max-w-[150px] md:hover:-translate-y-1 md:hover:scale-[1.02] md:hover:shadow-[0_8px_20px_rgba(21,62,115,0.08)]";

export function WeeklyOpenGroupCard({ event }: { event: GroupBuyHubEvent }) {
  const product = primaryProduct(event);
  const image = eventImage(event);
  const { price, original } = eventPrices(event);
  const joined = soldCount(event);
  const remain = remainDaysLabel(event.end_at);
  const href = `/group-buy/${event.id}`;
  const name = product?.name || event.title;

  return (
    <article className={CARD}>
      <div className="relative">
        <Link href={href} className="relative block h-[88px] overflow-hidden rounded-[16px] bg-[#FFFEFA]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-[10px] text-[#687386]">
              團購
            </span>
          )}
        </Link>
        {product?.id ? (
          <div className="absolute right-1 top-1 z-10">
            <FavoriteButton targetType="product" targetId={product.id} size="sm" />
          </div>
        ) : null}
      </div>

      <div className="mt-1.5 flex min-h-0 flex-1 flex-col">
        <Link href={href}>
          <h3 className="line-clamp-2 text-[12px] font-bold leading-snug text-[#153E73]">
            {name}
          </h3>
        </Link>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-[13px] font-extrabold text-[#F16458]">
            {formatCurrency(price)}
          </span>
          {original > price ? (
            <span className="text-[10px] text-[#9AA8B8] line-through">
              {formatCurrency(original)}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[10px] font-medium text-[#687386]">
          目前已跟團 {joined} 人
          {remain ? ` · 倒數 ${remain}` : null}
        </p>
        <Link
          href={href}
          className={cn(
            "mt-auto inline-flex h-8 w-full items-center justify-center rounded-full bg-[#FFD454] text-[11px] font-extrabold text-[#153E73] transition",
            "hover:brightness-95 active:scale-[0.98] md:hover:scale-[1.02]"
          )}
        >
          加入團購
        </Link>
      </div>
    </article>
  );
}
