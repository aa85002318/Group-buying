/** Shared product / group-buy rail card size — matches homepage「一鍵買齊材料」. */

export const PRODUCT_RAIL_CARD_WIDTH =
  "w-[calc((100vw-48px)/2.15)] min-w-[156px] max-w-[176px] md:w-[210px] md:min-w-[210px] md:max-w-[210px] xl:w-[220px] xl:min-w-[220px] xl:max-w-[220px]";

export const PRODUCT_RAIL_CARD_HEIGHT =
  "h-[280px] md:h-[320px]";

/** Outer shell — no padding; image is full-bleed, body has its own white pad. */
export const PRODUCT_RAIL_CARD_SHELL = [
  "ingredient-shop-card group relative flex shrink-0 snap-start flex-col overflow-hidden",
  "rounded-2xl border border-[#E9EDF2] bg-white shadow-[0_5px_16px_rgba(21,62,115,0.05)]",
  "transition duration-300",
  PRODUCT_RAIL_CARD_HEIGHT,
  PRODUCT_RAIL_CARD_WIDTH,
].join(" ");

/** Full-bleed image plane (edge-to-edge within the card). */
export const PRODUCT_RAIL_IMAGE_FRAME =
  "relative block w-full h-[135px] shrink-0 overflow-hidden bg-[#F4F6F8] md:h-[165px] xl:h-[170px]";

/** Cover crop — no inset padding. */
export const PRODUCT_RAIL_IMAGE =
  "object-cover object-center";

/** Fixed white footer for title / price / CTA. */
export const PRODUCT_RAIL_BODY =
  "flex min-h-0 flex-1 flex-col bg-white px-2.5 pb-2.5 pt-2 md:px-3 md:pb-3";

export const PRODUCT_RAIL_SKELETON = [
  "home-skeleton shrink-0 rounded-2xl",
  PRODUCT_RAIL_CARD_HEIGHT,
  PRODUCT_RAIL_CARD_WIDTH,
].join(" ");
