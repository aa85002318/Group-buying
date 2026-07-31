"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { useCart } from "@/hooks/useCart";
import { formatCurrency, cn } from "@/lib/utils";
import { GroupBuyHubHeader } from "./GroupBuyHubHeader";
import {
  FEATURED_TABS,
  eventImage,
  eventPrices,
  matchesFeaturedTab,
  primaryProduct,
  soldCount,
  type FeaturedTabId,
  type GroupBuyHubEvent,
} from "./types";

export function FeaturedGroupBuySection({ events }: { events: GroupBuyHubEvent[] }) {
  const [tab, setTab] = useState<FeaturedTabId>("all");
  const visible = useMemo(
    () => events.filter((e) => matchesFeaturedTab(e, tab)).slice(0, 8),
    [events, tab]
  );

  return (
    <section className="gb-hub-section" aria-label="CHIMEIDIY 團購精選">
      <GroupBuyHubHeader title="CHIMEIDIY 團購精選" href="/group-buy" />

      <div className="gb-hub-tabs mb-3.5 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FEATURED_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3.5 text-[13px] font-bold transition",
                active
                  ? "bg-[#FFD454] text-[#153E73]"
                  : "bg-white text-[#153E73] ring-1 ring-[#E9EDF2]"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-[24px] border border-[#E9EDF2] bg-white px-4 py-8 text-center text-sm text-[#687386]">
          此分類暫無團購精選
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {visible.map((event) => (
            <FeaturedProductCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedProductCard({ event }: { event: GroupBuyHubEvent }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const product = primaryProduct(event);
  const image = eventImage(event);
  const { price } = eventPrices(event);
  const sold = soldCount(event);
  const href = `/group-buy/${event.id}`;
  const name = product?.name || event.title;

  const onAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product?.id || adding) return;
    setAdding(true);
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        price,
        imageUrl: product.image_url,
        quantity: 1,
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-[24px] border border-[#E9EDF2] bg-white p-2.5 shadow-[0_4px_14px_rgba(21,62,115,0.05)] transition duration-300 md:hover:-translate-y-1 md:hover:scale-[1.02]">
      <div className="relative">
        <Link href={href} className="relative block aspect-square overflow-hidden rounded-[18px] bg-[#FFFEFA]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-[#687386]">
              商品
            </span>
          )}
        </Link>
        {product?.id ? (
          <div className="absolute right-1.5 top-1.5 z-10">
            <FavoriteButton targetType="product" targetId={product.id} size="sm" />
          </div>
        ) : null}
      </div>
      <Link href={href} className="mt-2">
        <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-[#153E73]">
          {name}
        </h3>
      </Link>
      <p className="mt-1 text-[15px] font-extrabold text-[#F16458]">
        {formatCurrency(price)}
      </p>
      <p className="mt-0.5 text-[11px] text-[#687386]">已售 {sold}</p>
      <button
        type="button"
        disabled={!product?.id || adding}
        onClick={onAdd}
        className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-full bg-[#153E73] text-[12px] font-extrabold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 md:hover:scale-[1.02]"
      >
        {adding ? "加入中…" : "加入購物車"}
      </button>
    </article>
  );
}
