"use client";

import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import type { RecipeProductRecommendation } from "@/lib/types/database";

export function RelatedProducts({
  recommendations,
}: {
  recommendations: RecipeProductRecommendation[];
}) {
  const items = recommendations
    .map((row) => row.products)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (!items.length) return null;

  return (
    <section className="mt-14">
      <h2 className="text-xl font-semibold text-[#153E73]">相關商品</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/shop/products/${p.id}`}
            className="overflow-hidden rounded-2xl border border-[#E8E1D7] bg-white transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="relative aspect-square bg-[#FFF5CC]">
              {p.image_url ? (
                <Image src={p.image_url} alt={p.name} fill className="object-contain p-3" sizes="240px" />
              ) : null}
            </div>
            <div className="space-y-1 px-3 py-3">
              <p className="line-clamp-2 text-sm font-medium text-[#153E73]">{p.name}</p>
              <p className="text-sm font-semibold text-[#F16458]">{formatCurrency(p.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
