import { cn } from "@/lib/utils";

export type ProductStickerType = "new" | "hot" | "live" | "preorder" | "limited";

const STICKERS: Record<ProductStickerType, { label: string; className: string }> = {
  new: { label: "NEW", className: "bg-primary text-white -rotate-6" },
  hot: { label: "HOT", className: "bg-error text-white rotate-3" },
  live: { label: "LIVE", className: "bg-error text-white -rotate-3 animate-live" },
  preorder: { label: "預購", className: "bg-warning text-foreground rotate-2" },
  limited: { label: "限量", className: "bg-groupBuy text-white -rotate-2" },
};

type ProductStickerProps = {
  type: ProductStickerType;
  className?: string;
};

/** Product corner sticker — Visual System 2.0 tones */
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
