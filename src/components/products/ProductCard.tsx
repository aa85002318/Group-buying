import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { ProductSticker, type ProductStickerType } from "@/components/brand/ProductSticker";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  href?: string;
  groupBuyLabel?: string;
  sticker?: ProductStickerType;
  /** Use group-buy CTA styling when true */
  isGroupBuy?: boolean;
}

export function ProductCard({
  id,
  name,
  price,
  original_price,
  image_url,
  href,
  groupBuyLabel,
  sticker,
  isGroupBuy,
}: ProductCardProps) {
  const link = href ?? `/products/${id}`;
  const saving =
    original_price && original_price > price ? original_price - price : 0;
  const groupBuy = Boolean(isGroupBuy || groupBuyLabel);

  return (
    <Link href={link} className="group block">
      <Card className="overflow-hidden rounded-card border-border bg-surface shadow-card transition duration-250 ease-brand hover:-translate-y-1 hover:shadow-lift">
        <div className="relative aspect-square overflow-hidden rounded-t-card bg-surface-soft">
          <div className="absolute right-2 top-2 z-10">
            <FavoriteButton productId={id} size="sm" />
          </div>
          {sticker && <ProductSticker type={sticker} />}
          {!sticker && groupBuyLabel && (
            <span className="sticker absolute left-2 top-2 z-10 bg-groupBuy text-white">
              {groupBuyLabel}
            </span>
          )}
          {image_url ? (
            <Image
              src={image_url}
              alt={name}
              fill
              className="object-cover transition duration-400 ease-brand group-hover:scale-105"
              sizes="(max-width:768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-foreground-secondary">
              暫無圖片
            </div>
          )}
          {saving > 0 && (
            <span className="absolute bottom-2 left-2 rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-black text-foreground shadow-sticker">
              現省 {formatCurrency(saving)}
            </span>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="line-clamp-2 text-sm font-bold text-foreground">{name}</h3>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className={cn("price-text")}>{formatCurrency(price)}</span>
            {original_price && original_price > price && (
              <span className="text-xs text-foreground-secondary line-through">
                {formatCurrency(original_price)}
              </span>
            )}
          </div>
          {groupBuy && (
            <span className="mt-2 inline-flex text-[10px] font-bold text-groupBuy">團購價</span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
