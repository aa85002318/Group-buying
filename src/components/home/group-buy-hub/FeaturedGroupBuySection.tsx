"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Filter, ChevronDown, Loader2, Plus } from "lucide-react";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { MoreProductsCard } from "@/components/home/ingredient-shop/MoreProductsCard";
import { ProductHorizontalScroller } from "@/components/home/ingredient-shop/ProductHorizontalScroller";
import { useCart } from "@/hooks/useCart";
import { formatCurrency, cn } from "@/lib/utils";
import {
  PRODUCT_RAIL_CARD_SHELL,
  PRODUCT_RAIL_IMAGE_FRAME,
  PRODUCT_RAIL_SKELETON,
} from "@/lib/ui/product-rail";
import { GroupBuyHubHeader } from "./GroupBuyHubHeader";
import {
  FEATURED_TABS,
  eventImage,
  eventPrices,
  matchesFeaturedTab,
  primaryProduct,
  type FeaturedTabId,
  type GroupBuyHubEvent,
} from "./types";
import type { HomeCategoryMenuItem } from "@/lib/home/category-menu";

const tabBase =
  "inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border px-3.5 text-[13px] font-semibold transition md:h-10 md:gap-1.5 md:rounded-[14px] md:px-[18px] md:text-sm";

/** CHIMEIDIY 團購精選 — same layout language as「一鍵買齊材料」. */
export function FeaturedGroupBuySection({
  events,
  loading = false,
  title = "CHIMEIDIY 團購精選",
  subtitle = "精選團購好物，一起買更划算",
  viewAllHref = "/group-buy",
  categoryMenu,
}: {
  events: GroupBuyHubEvent[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  categoryMenu?: HomeCategoryMenuItem[];
}) {
  const [tab, setTab] = useState<FeaturedTabId>("all");
  const visible = useMemo(
    () => events.filter((e) => matchesFeaturedTab(e, tab)).slice(0, 12),
    [events, tab]
  );

  const menuTabs =
    categoryMenu && categoryMenu.length > 0
      ? categoryMenu.map((m) => ({ id: m.id, label: m.label, href: m.href }))
      : FEATURED_TABS.map((t) => ({ id: t.id, label: t.label, href: null as string | null }));

  return (
    <section className="gb-hub-section gb-hub-featured" aria-label={title}>
      <GroupBuyHubHeader title={title} subtitle={subtitle} href={viewAllHref} />

      <div className="mb-3.5 md:mb-[18px]">
        <div
          className="ingredient-shop-tabs flex gap-2 overflow-x-auto pb-0.5 md:gap-2.5"
          role="tablist"
          aria-label="團購分類"
        >
          {menuTabs.map((t) => {
            if (t.href) {
              return (
                <Link
                  key={t.id}
                  href={t.href}
                  className={cn(
                    tabBase,
                    "border-[#E9EDF2] bg-white text-[#153E73] hover:border-[#d5dde6]"
                  )}
                >
                  {t.label}
                </Link>
              );
            }
            const selected = tab === (t.id as FeaturedTabId);
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t.id as FeaturedTabId)}
                className={cn(
                  tabBase,
                  selected
                    ? "border-transparent bg-[#FFD454] text-[#153E73] shadow-[0_4px_12px_rgba(21,62,115,0.08)]"
                    : "border-[#E9EDF2] bg-white text-[#153E73] hover:border-[#d5dde6]"
                )}
              >
                {t.label}
              </button>
            );
          })}
          <Link
            href={viewAllHref}
            className={cn(tabBase, "border-[#E9EDF2] bg-white text-[#153E73] hover:border-[#d5dde6]")}
          >
            <Filter className="h-4 w-4 md:h-[18px] md:w-[18px]" aria-hidden />
            更多選項
            <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-2.5 overflow-hidden pb-2 md:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={PRODUCT_RAIL_SKELETON} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-[#E9EDF2] bg-white px-4 py-6 text-center text-sm text-[#687386]">
          此分類暫無團購精選，試試其他分類或前往團購專區。
        </p>
      ) : (
        <ProductHorizontalScroller>
          {visible.map((event) => (
            <FeaturedShopStyleCard key={event.id} event={event} />
          ))}
          <MoreProductsCard
            title="更多團購"
            subtitle="查看全部團購"
            href="/group-buy"
          />
        </ProductHorizontalScroller>
      )}
    </section>
  );
}

function FeaturedShopStyleCard({ event }: { event: GroupBuyHubEvent }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const product = primaryProduct(event);
  const image = eventImage(event);
  const { price, original } = eventPrices(event);
  const href = `/group-buy/${event.id}`;
  const name = product?.name || event.title;
  const soldOut = product?.stock === 0;

  const onAdd = async () => {
    if (!product?.id || soldOut || adding) return;
    setAdding(true);
    setToast(null);
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        price,
        imageUrl: product.image_url,
        quantity: 1,
      });
      setToast("已加入購物車");
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "加入失敗");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article
      className={cn(
        PRODUCT_RAIL_CARD_SHELL,
        !soldOut && "md:hover:-translate-y-0.5 md:hover:shadow-[0_8px_20px_rgba(21,62,115,0.08)]"
      )}
    >
      <div className="relative">
        <Link
          href={href}
          className={cn(PRODUCT_RAIL_IMAGE_FRAME, soldOut && "opacity-60")}
        >
          <div className="absolute right-1.5 top-1.5 z-10">
            {product?.id ? (
              <FavoriteButton
                productId={product.id}
                size="sm"
                className="!h-8 !w-8 !rounded-full !border !border-[#E9EDF2] !bg-white/95 !shadow-none md:!h-[34px] md:!w-[34px]"
              />
            ) : null}
          </div>
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-contain p-2.5 md:p-3.5"
              sizes="(max-width: 767px) 176px, (max-width: 1279px) 210px, 220px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#687386]">
              暫無圖片
            </div>
          )}
        </Link>
      </div>

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-[1.4] text-[#153E73] md:min-h-[42px] md:text-[15px]">
            {name}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <span className="text-[17px] font-bold leading-none text-[#F16458] md:text-xl">
              {formatCurrency(price)}
            </span>
            {original > price ? (
              <p className="mt-0.5 text-[11px] text-[#687386] line-through md:text-xs">
                {formatCurrency(original)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="加入購物車"
            disabled={!product?.id || soldOut || adding}
            onClick={onAdd}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFD454] text-[#153E73] transition hover:brightness-95 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:w-10"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin md:h-[19px] md:w-[19px]" aria-hidden />
            ) : (
              <Plus className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>

        {toast ? (
          <p className="mt-1 text-center text-[10px] font-medium text-[#153E73]" role="status">
            {toast}
          </p>
        ) : null}
      </div>
    </article>
  );
}
