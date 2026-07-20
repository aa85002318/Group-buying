"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { getMockProductById } from "@/lib/mock-data";
import { RecommendedProducts } from "@/components/products/RecommendedProducts";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import type { Product } from "@/lib/types/database";

export default function ProductDetailClient({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d) => {
        if (d.product) {
          setProduct(d.product);
          setActiveImage(0);
          fetch("/api/product-views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: d.product.id }),
          }).catch(() => {});
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        const fallback = getMockProductById(id);
        if (fallback) setProduct(fallback);
        else setNotFound(true);
      })
      .finally(() => setLoading(false));

    if (ref) {
      fetch("/api/share/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sharerUserId: ref,
          shareType: "product",
          targetId: id,
          refCode: ref,
        }),
      }).catch(() => {});
    }
  }, [id, ref]);

  const images = useMemo(() => {
    if (!product) return [];
    const list = [product.image_url, ...(product.images ?? [])].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [product]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="aspect-square animate-pulse rounded-xl bg-muted" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-muted-foreground">找不到此商品</p>
        <Link href="/products" className="text-sm text-primary hover:underline">
          返回商品列表
        </Link>
      </div>
    );
  }

  const maxQty = Math.max(1, product.stock);
  const isOnSale =
    product.original_price != null && product.original_price > product.price;
  const outOfStock = product.stock <= 0;

  const handleAdd = async () => {
    if (outOfStock) {
      alert("此商品目前無庫存");
      return;
    }
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: Math.min(quantity, product.stock),
        imageUrl: product.image_url,
      });
      alert("已加入購物車");
    } catch (e) {
      alert(e instanceof Error ? e.message : "無法加入購物車");
    }
  };

  return (
    <div className="space-y-5">
      <Link href="/products" className="text-sm text-primary hover:underline">
        ← 返回商品列表
      </Link>

      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <div className="absolute right-3 top-3 z-10">
            <FavoriteButton productId={product.id} />
          </div>
          {images.length > 0 ? (
            <Image
              src={images[activeImage]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
              priority
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">暫無圖片</div>
          )}
          {isOnSale && (
            <Badge variant="tag" className="absolute left-3 top-3 z-10">
              限時優惠
            </Badge>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveImage(index)}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted",
                  activeImage === index ? "border-primary" : "border-transparent"
                )}
              >
                <Image src={src} alt="" fill className="object-cover" unoptimized />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {product.product_categories?.name && (
          <Link
            href={`/products?category=${product.category_id}`}
            className="inline-block text-xs text-primary hover:underline"
          >
            {product.product_categories.name}
          </Link>
        )}

        <h1 className="text-xl font-bold text-coffee">{product.name}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xl font-bold text-promo">{formatCurrency(product.price)}</span>
          {isOnSale && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.original_price!)}
            </span>
          )}
          <Badge variant={outOfStock ? "secondary" : "primary"}>
            {outOfStock ? "已售完" : `庫存 ${product.stock}`}
          </Badge>
        </div>

        {(product.preorder_deadline || product.expected_arrival_date) && (
          <div className="rounded-lg bg-tag-bg px-3 py-2 text-xs text-tag-text space-y-1">
            {product.preorder_deadline && (
              <p>預購截止：{formatDate(product.preorder_deadline)}</p>
            )}
            {product.expected_arrival_date && (
              <p>預計到貨：{formatDate(product.expected_arrival_date)}</p>
            )}
          </div>
        )}

        {product.description && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold text-coffee">商品說明</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
        )}

        {product.disclaimer && (
          <p className="rounded-lg bg-butter-soft p-3 text-xs text-caramel">{product.disclaimer}</p>
        )}

        {ref && <p className="text-xs text-coffee">推薦碼：{ref}</p>}
      </div>

      <div
        className="sticky z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
        style={{
          bottom: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-border bg-card">
            <button
              type="button"
              className="px-3 py-2 text-lg disabled:opacity-40"
              disabled={quantity <= 1}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{quantity}</span>
            <button
              type="button"
              className="px-3 py-2 text-lg disabled:opacity-40"
              disabled={quantity >= maxQty}
              onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
            >
              +
            </button>
          </div>
          <Button
            className="flex-1"
            variant="promo"
            disabled={outOfStock}
            onClick={handleAdd}
          >
            {outOfStock ? "已售完" : "加入購物車"}
          </Button>
        </div>
        <Link href="/cart" className="mt-2 block text-center text-sm text-primary hover:underline">
          查看購物車
        </Link>
      </div>

      <RecommendedProducts productId={product.id} />
    </div>
  );
}
