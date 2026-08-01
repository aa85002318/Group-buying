/** Shared product / group-buy rail card size — matches homepage「一鍵買齊材料」. */

export const PRODUCT_RAIL_CARD_WIDTH =
  "w-[calc((100vw-48px)/2.15)] min-w-[156px] max-w-[176px] md:w-[210px] md:min-w-[210px] md:max-w-[210px] xl:w-[220px] xl:min-w-[220px] xl:max-w-[220px]";

export const PRODUCT_RAIL_CARD_HEIGHT =
  "h-[280px] md:h-[320px]";

export const PRODUCT_RAIL_CARD_SHELL = [
  "ingredient-shop-card group flex shrink-0 snap-start flex-col overflow-hidden",
  "rounded-2xl border border-[#E9EDF2] bg-white p-2.5 shadow-[0_5px_16px_rgba(21,62,115,0.05)]",
  "transition duration-300 md:p-3",
  PRODUCT_RAIL_CARD_HEIGHT,
  PRODUCT_RAIL_CARD_WIDTH,
].join(" ");

export const PRODUCT_RAIL_IMAGE_FRAME =
  "relative block h-[135px] overflow-hidden rounded-xl bg-transparent md:h-[165px] xl:h-[170px]";

export const PRODUCT_RAIL_SKELETON = [
  "home-skeleton shrink-0 rounded-2xl",
  PRODUCT_RAIL_CARD_HEIGHT,
  PRODUCT_RAIL_CARD_WIDTH,
].join(" ");
