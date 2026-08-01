"use client";

import Link from "next/link";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { formatCurrency, cn } from "@/lib/utils";
import {
  PRODUCT_RAIL_CARD_SHELL,
  PRODUCT_RAIL_IMAGE_FRAME,
} from "@/lib/ui/product-rail";
import {
  eventImage,
  eventPrices,
  primaryProduct,
  remainDaysLabel,
  soldCount,
  type GroupBuyHubEvent,
} from "./types";

export function WeeklyOpenGroupCard({ event }: { event: GroupBuyHubEvent }) {
  const product = primaryProduct(event);
  const image = eventImage(event);
  const { price, original } = eventPrices(event);
  const joined = soldCount(event);
  const remain = remainDaysLabel(event.end_at);
  const href = `/group-buy/${event.id}`;
  const name = product?.name || event.title;

  return (
    <article
      className={cn(
        PRODUCT_RAIL_CARD_SHELL,
        "md:hover:-translate-y-0.5 md:hover:shadow-[0_8px_20px_rgba(21,62,115,0.08)]"
      )}
    >
      <div className="relative">
        <Link href={href} className={PRODUCT_RAIL_IMAGE_FRAME}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-contain p-2.5 md:p-3.5" />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-[#687386]">
              團購
            </span>
          )}
        </Link>
        {product?.id ? (
          <div className="absolute right-1.5 top-1.5 z-10">
            <FavoriteButton
              targetType="product"
              targetId={product.id}
              size="sm"
              className="!h-8 !w-8 !rounded-full !border !border-[#E9EDF2] !bg-white/95 !shadow-none md:!h-[34px] md:!w-[34px]"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-[1.4] text-[#153E73] md:min-h-[42px] md:text-[15px]">
            {name}
          </h3>
        </Link>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-[17px] font-bold leading-none text-[#F16458] md:text-xl">
            {formatCurrency(price)}
          </span>
          {original > price ? (
            <span className="text-[11px] text-[#9AA8B8] line-through md:text-xs">
              {formatCurrency(original)}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[11px] font-medium text-[#687386] md:text-xs">
          目前已跟團 {joined} 人
          {remain ? ` · 倒數 ${remain}` : null}
        </p>
        <Link
          href={href}
          className={cn(
            "mt-auto inline-flex h-9 w-full items-center justify-center rounded-full bg-[#FFD454] text-sm font-bold text-[#153E73] transition md:h-10",
            "hover:brightness-95 active:scale-[0.98]"
          )}
        >
          加入團購
        </Link>
      </div>
    </article>
  );
}
