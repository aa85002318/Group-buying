import { cn } from "@/lib/utils";

export type ProductStickerType = "new" | "hot" | "live" | "preorder" | "limited";

const STICKERS: Record<ProductStickerType, { label: string; className: string }> = {
  new: { label: "NEW", className: "bg-[#C45CDB] text-white -rotate-6" },
  hot: { label: "HOT", className: "bg-brand-gradient text-white rotate-3" },
  live: { label: "LIVE", className: "bg-[#E53935] text-white -rotate-3 animate-live" },
  preorder: { label: "預購", className: "bg-[#3A86FF] text-white rotate-2" },
  limited: { label: "限量", className: "bg-promo-gradient text-[#222222] -rotate-2" },
};

type ProductStickerProps = {
  type: ProductStickerType;
  className?: string;
};

/** Folded-corner style product sticker */
export function ProductSticker({ type, className }: ProductStickerProps) {
  const s = STICKERS[type];
  return (
    <span
      className={cn(
        "sticker absolute left-2 top-2 z-10 origin-top-left",
        s.className,
        className
      )}
    >
      {s.label}
    </span>
  );
}
