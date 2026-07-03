import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  href?: string;
  groupBuyLabel?: string;
}

export function ProductCard({
  id,
  name,
  price,
  original_price,
  image_url,
  href,
  groupBuyLabel,
}: ProductCardProps) {
  const link = href ?? `/products/${id}`;
  return (
    <Link href={link}>
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-square bg-muted">
          {groupBuyLabel && (
            <Badge variant="tag" className="absolute left-2 top-2 z-10">
              {groupBuyLabel}
            </Badge>
          )}
          {image_url ? (
            <Image src={image_url} alt={name} fill className="object-cover" sizes="(max-width:768px) 50vw, 25vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">暫無圖片</div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="line-clamp-2 text-sm font-medium">{name}</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-bold text-promo">{formatCurrency(price)}</span>
            {original_price && original_price > price && (
              <span className="text-xs text-muted-foreground line-through">{formatCurrency(original_price)}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
