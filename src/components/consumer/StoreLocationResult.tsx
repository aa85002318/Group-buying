import Link from "next/link";
import { MapPin } from "lucide-react";
import type { ProductLocation } from "@/lib/consumer-hub";
import { STORE_ZONES } from "@/lib/mock/consumer-hub";

export function StoreLocationResult({ item }: { item: ProductLocation }) {
  const zone = STORE_ZONES.find((z) => z.code === item.zoneCode);
  const place = [item.aisle, item.shelf, item.level ? `層 ${item.level}` : null]
    .filter(Boolean)
    .join("／");

  return (
    <article className="card-surface p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-success-soft text-success">
          <MapPin className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-foreground">{item.productName}</h3>
          <p className="mt-1 text-sm font-bold text-success">
            {zone?.name ?? item.zoneCode}
            {place ? `／${place}` : ""}
          </p>
          {item.description && (
            <p className="mt-1 text-sm text-foreground-secondary">{item.description}</p>
          )}
          {(item.sku || item.barcode) && (
            <p className="mt-2 text-xs text-foreground-secondary">
              {item.sku ? `SKU ${item.sku}` : ""}
              {item.sku && item.barcode ? " · " : ""}
              {item.barcode ? `Barcode ${item.barcode}` : ""}
            </p>
          )}
          <Link href={`/products?search=${encodeURIComponent(item.productName)}`} className="mt-3 inline-flex text-sm font-bold text-primary">
            在商城查看 →
          </Link>
        </div>
      </div>
    </article>
  );
}
