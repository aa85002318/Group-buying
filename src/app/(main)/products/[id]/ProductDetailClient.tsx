"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Package,
  Search,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { getMockProductById } from "@/lib/mock-data";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { recordBrowse } from "@/lib/home/browse-history";
import {
  PRODUCT_IMAGE_FALLBACK,
  resolveProductGallery,
  widthModeClass,
  type ProductImageItem,
} from "@/lib/products/product-images";
import type { Product } from "@/lib/types/database";
import { looksLikeHtml } from "@/lib/cms/safeHtml";
import { defaultSiteDocumentContent } from "@/lib/site-pages/defaults";
import { RichTextHtml } from "@/components/cms/RichTextHtml";

type Variant = {
  id: string;
  name: string;
  value?: string | null;
  price?: number | null;
  sale_price?: number | null;
  price_adjustment?: number | null;
  stock?: number | null;
};

type RelatedRecipe = {
  id: string;
  title?: string | null;
  name?: string | null;
  cover_image_url?: string | null;
  image_url?: string | null;
  difficulty?: string | null;
  total_minutes?: number | null;
  slug?: string | null;
};

type RelatedProduct = {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  stock?: number;
};

type TabId = "intro" | "specs" | "shipping" | "reviews";

const TABS: { id: TabId; label: string }[] = [
  { id: "intro", label: "商品介紹" },
  { id: "specs", label: "商品規格" },
  { id: "shipping", label: "配送取貨" },
  { id: "reviews", label: "商品評價" },
];

function stripDemoPrefix(name: string) {
  return name.replace(/^\[DEMO\]\s*/i, "").trim();
}

function SafeImage({
  src,
  alt,
  className,
  sizes,
  priority,
  fill,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const finalSrc = failed || !src ? PRODUCT_IMAGE_FALLBACK : src;
  return (
    <Image
      src={finalSrc}
      alt={alt || "商品圖片"}
      fill={fill}
      priority={priority}
      sizes={sizes}
      className={className}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

export default function ProductDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const [product, setProduct] = useState<Product | null>(null);
  const [gallery, setGallery] = useState<{ url: string; alt: string }[]>([]);
  const [contentImages, setContentImages] = useState<ProductImageItem[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [relatedRecipes, setRelatedRecipes] = useState<RelatedRecipe[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("intro");
  const [toast, setToast] = useState<string | null>(null);
  const [shippingNotice, setShippingNotice] = useState(
    defaultSiteDocumentContent("shipping")
  );
  const { addItem, items } = useCart();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    fetch("/api/site-pages/shipping")
      .then((r) => r.json())
      .then((d) => {
        const content = String(d.document?.content ?? "").trim();
        if (content) setShippingNotice(content);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/products/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d) => {
        if (!d.product) {
          setNotFound(true);
          return;
        }
        setProduct(d.product);
        setGallery(
          Array.isArray(d.gallery) && d.gallery.length
            ? d.gallery
            : resolveProductGallery(d.product)
        );
        setContentImages(Array.isArray(d.content_images) ? d.content_images : []);
        setVariants(Array.isArray(d.variants) ? d.variants : []);
        setRelatedRecipes(Array.isArray(d.related_recipes) ? d.related_recipes : []);
        setRelatedProducts(
          (Array.isArray(d.related_products) ? d.related_products : [])
            .filter((p: RelatedProduct) => !String(p.name).includes("[DEMO]"))
            .slice(0, 6)
        );
        setActiveImage(0);
        setSelectedVariantId(d.variants?.[0]?.id ?? null);
        fetch("/api/product-views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: d.product.id }),
        }).catch(() => {});
        recordBrowse({
          type: "product",
          id: d.product.id,
          title: stripDemoPrefix(d.product.name),
          imageUrl: d.product.image_url,
          href: `/products/${d.product.id}`,
          price: d.product.price,
        });
      })
      .catch(() => {
        const fallback = getMockProductById(id);
        if (fallback) {
          setProduct(fallback);
          setGallery(resolveProductGallery(fallback));
        } else setNotFound(true);
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

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId]
  );

  const displayPrice = useMemo(() => {
    if (!product) return 0;
    if (selectedVariant?.sale_price != null) return Number(selectedVariant.sale_price);
    if (selectedVariant?.price != null) return Number(selectedVariant.price);
    if (selectedVariant?.price_adjustment != null) {
      return Number(product.price) + Number(selectedVariant.price_adjustment);
    }
    return Number(product.price);
  }, [product, selectedVariant]);

  const displayOriginal = useMemo(() => {
    if (!product) return null;
    const orig = product.original_price != null ? Number(product.original_price) : null;
    if (orig != null && orig > displayPrice) return orig;
    return null;
  }, [product, displayPrice]);

  const stock = useMemo(() => {
    if (selectedVariant?.stock != null) return Number(selectedVariant.stock);
    return Number(product?.stock ?? 0);
  }, [product, selectedVariant]);

  const outOfStock = stock <= 0;
  const lowStock = stock > 0 && stock <= 5;
  const maxQty = Math.max(1, stock);
  const memberPrice =
    product && (product as { vip_price?: number | null }).vip_price != null
      ? Number((product as { vip_price?: number }).vip_price)
      : null;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const handleAdd = async (buyNow = false) => {
    if (!product || outOfStock) {
      showToast("此商品目前無庫存");
      return;
    }
    try {
      await addItem({
        productId: product.id,
        name: stripDemoPrefix(product.name),
        price: displayPrice,
        quantity: Math.min(quantity, stock),
        imageUrl: gallery[0]?.url || product.image_url,
      });
      if (buyNow) {
        router.push("/cart");
        return;
      }
      showToast("已加入購物車");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "無法加入購物車");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-4">
        <div className="aspect-square max-w-[560px] animate-pulse rounded-2xl bg-[#E8E1D7]/60" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#E8E1D7]/40" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-[#667085]">找不到此商品</p>
        <Link href="/shop" className="text-sm text-[#153E73] underline">
          返回商城
        </Link>
      </div>
    );
  }

  const name = stripDemoPrefix(product.name);
  const categoryName = product.product_categories?.name;
  const tags: string[] = [];
  if (product.is_hot) tags.push("熱銷");
  if (product.is_new) tags.push("新品");
  if ((product as { ship_store_pickup?: boolean }).ship_store_pickup !== false) tags.push("門市取貨");
  if ((product as { temp_ambient?: boolean }).temp_ambient) tags.push("常溫");
  if ((product as { temp_chilled?: boolean }).temp_chilled) tags.push("冷藏");
  if ((product as { temp_frozen?: boolean }).temp_frozen) tags.push("冷凍");
  if (Array.isArray((product as { tags?: unknown }).tags)) {
    for (const t of ((product as { tags?: unknown[] }).tags ?? []).slice(0, 4)) {
      if (typeof t === "string" && t && !tags.includes(t)) tags.push(t);
    }
  }

  const active = gallery[activeImage] ?? gallery[0];
  const showThumbs = gallery.length > 1;

  return (
    <div className="min-h-[100dvh] bg-[#FFFEFA] text-[#153E73]">
      {/* Mobile sticky header */}
      <header className="sticky top-0 z-40 border-b border-[#E8E1D7] bg-white md:hidden">
        <div className="flex h-14 items-center justify-between px-3">
          <button
            type="button"
            aria-label="返回"
            className="flex h-11 w-11 items-center justify-center rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold">商品詳情</h1>
          <div className="flex items-center gap-1">
            <Link
              href="/shop"
              aria-label="搜尋商品"
              className="flex h-11 w-11 items-center justify-center rounded-full"
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              href="/cart"
              aria-label={`購物車${cartCount ? `，${cartCount} 件` : ""}`}
              className="relative flex h-11 w-11 items-center justify-center rounded-full"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F16458] px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
        <nav className="px-4 pb-2 text-[11px] text-[#667085]" aria-label="麵包屑">
          <Link href="/shop" className="hover:underline">
            商城
          </Link>
          <span className="mx-1">／</span>
          {categoryName ? (
            <Link
              href={`/products?category=${product.category_id ?? ""}`}
              className="hover:underline"
            >
              {categoryName}
            </Link>
          ) : (
            <span>商品分類</span>
          )}
        </nav>
      </header>

      <div
        className="mx-auto max-w-[1200px] px-4 pb-[calc(100px+var(--bottom-nav-height)+env(safe-area-inset-bottom))] pt-3 md:grid md:grid-cols-[minmax(0,560px)_minmax(0,1fr)] md:gap-10 md:pb-16 md:pt-8"
      >
        {/* Gallery column */}
        <div className="space-y-3">
          <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-2xl bg-[#F7F1E7]">
            {active ? (
              <SafeImage
                src={active.url}
                alt={active.alt || name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 560px"
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#8A94A6]">
                暫無圖片
              </div>
            )}
            <div className="absolute right-3 top-3 z-10 md:right-4 md:top-4">
              <FavoriteButton productId={product.id} />
            </div>
            {showThumbs ? (
              <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white">
                {activeImage + 1}/{gallery.length}
              </span>
            ) : null}
          </div>

          {showThumbs ? (
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {gallery.slice(0, 8).map((img, index) => (
                <button
                  key={`${img.url}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px] border-2 bg-[#F7F1E7]",
                    activeImage === index ? "border-[#FEE169]" : "border-transparent"
                  )}
                >
                  <SafeImage src={img.url} alt="" fill className="object-contain" sizes="64px" />
                </button>
              ))}
            </div>
          ) : null}

          {/* Desktop-only skip sticky bar info sits beside on md */}
          <div className="hidden md:block md:space-y-4">
            {/* filler for layout balance - content continues in right column */}
          </div>
        </div>

        {/* Info column */}
        <div className="mt-4 space-y-4 md:mt-0">
          <div className="rounded-2xl border border-[#E8E1D7] bg-white p-4 shadow-sm md:p-6">
            {tags.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[#FFF5CC] px-2.5 py-1 text-[11px] font-semibold text-[#153E73]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            <h2 className="line-clamp-3 text-[22px] font-bold leading-snug text-[#153E73] md:text-3xl">
              {name}
            </h2>
            {(product.subtitle || product.short_description) && (
              <p className="mt-2 text-sm leading-relaxed text-[#667085]">
                {product.subtitle || product.short_description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <span className="text-[32px] font-bold leading-none text-[#F16458]">
                {formatCurrency(displayPrice)}
              </span>
              {displayOriginal != null ? (
                <span className="pb-1 text-sm text-[#8A94A6] line-through">
                  {formatCurrency(displayOriginal)}
                </span>
              ) : null}
            </div>

            {memberPrice != null && memberPrice < displayPrice ? (
              <p className="mt-2 text-sm text-[#153E73]">
                會員優惠價{" "}
                <span className="font-bold text-[#F16458]">{formatCurrency(memberPrice)}</span>
              </p>
            ) : null}

            <p className="mt-3 text-sm font-medium">
              {outOfStock ? (
                <span className="text-[#F16458]">目前缺貨</span>
              ) : lowStock ? (
                <span className="text-[#F16458]">即將售完｜剩餘 {stock}</span>
              ) : (
                <span className="text-[#153E73]">現貨｜庫存 {stock}</span>
              )}
            </p>

            {variants.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">規格</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const label = v.value || v.name;
                    const selected = v.id === selectedVariantId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          setQuantity(1);
                        }}
                        className={cn(
                          "min-h-11 rounded-full border px-4 text-sm font-semibold",
                          selected
                            ? "border-[#FEE169] bg-[#FEE169] text-[#153E73]"
                            : "border-[#E8E1D7] bg-white text-[#153E73]"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">數量</p>
              <div className="inline-flex items-center rounded-full border border-[#E8E1D7] bg-white">
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center text-lg disabled:opacity-40"
                  disabled={quantity <= 1 || outOfStock}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center text-lg disabled:opacity-40"
                  disabled={quantity >= maxQty || outOfStock}
                  onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                >
                  +
                </button>
              </div>
            </div>

            {/* Desktop CTA */}
            <div className="mt-6 hidden gap-3 md:flex">
              <button
                type="button"
                disabled={outOfStock}
                onClick={() => void handleAdd(false)}
                className="flex h-12 flex-1 items-center justify-center rounded-full border-2 border-[#FEE169] bg-white text-sm font-bold text-[#153E73] disabled:opacity-40"
              >
                {outOfStock ? "補貨通知" : "加入購物車"}
              </button>
              <button
                type="button"
                disabled={outOfStock}
                onClick={() => void handleAdd(true)}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#153E73] text-sm font-bold text-white disabled:opacity-40"
              >
                {outOfStock ? "補貨通知" : "立即購買"}
              </button>
            </div>
          </div>

          {/* Service features */}
          <div className="grid grid-cols-3 gap-2 rounded-[14px] border border-[#E8E1D7] bg-white p-3">
            {[
              { icon: Check, label: "品質嚴選" },
              { icon: Store, label: "門市取貨" },
              { icon: Package, label: "安心包裝" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 px-1 py-2 text-center">
                <s.icon className="h-5 w-5 text-[#153E73]" strokeWidth={1.75} />
                <span className="text-[11px] font-semibold leading-tight text-[#153E73]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="overflow-hidden rounded-2xl border border-[#E8E1D7] bg-white">
            <div className="flex gap-1 overflow-x-auto border-b border-[#E8E1D7] px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative shrink-0 px-3 py-3 text-sm",
                    tab === t.id ? "font-bold text-[#153E73]" : "font-medium text-[#667085]"
                  )}
                >
                  {t.label}
                  {tab === t.id ? (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#FEE169]" />
                  ) : null}
                </button>
              ))}
            </div>
            <div className="space-y-3 p-4">
              {tab === "intro" ? (
                <>
                  <IntroCard title="商品特色">
                    {(product as { rich_description?: string | null }).rich_description ||
                      product.description ||
                      "尚無商品特色說明。"}
                  </IntroCard>
                  <IntroCard title="適合用途">
                    {(product as { product_info?: string }).product_info ||
                      product.subtitle ||
                      "適合居家烘焙與日常料理使用。"}
                  </IntroCard>
                  <IntroCard title="商品規格">
                    {product.specifications ||
                      product.package_spec ||
                      (product.unit ? `單位：${product.unit}` : "請見包裝標示。")}
                  </IntroCard>
                  {contentImages.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold">商品內容圖片</h3>
                      {contentImages.map((img, i) => (
                        <figure key={`${img.url}-${i}`} className={cn("space-y-2", widthModeClass(img.width_mode))}>
                          {img.caption ? (
                            <figcaption className="text-sm font-medium text-[#153E73]">
                              {img.caption}
                            </figcaption>
                          ) : null}
                          <div className="relative w-full overflow-hidden rounded-xl bg-[#F7F1E7]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={img.alt_text || `${name} 內容圖 ${i + 1}`}
                              loading="lazy"
                              className="h-auto w-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        </figure>
                      ))}
                    </div>
                  ) : null}
                  <IntroCard title="配送注意事項">
                    {shippingNotice}
                  </IntroCard>
                  <p className="text-xs text-[#667085]">
                    <Link href="/support/shipping" className="font-medium text-[#153E73] underline">
                      查看完整配送說明
                    </Link>
                  </p>
                </>
              ) : null}
              {tab === "specs" ? (
                <dl className="space-y-2 text-sm">
                  {[
                    ["SKU", product.sku],
                    ["條碼", product.barcode],
                    ["單位", product.unit],
                    ["淨重", (product as { weight_grams?: number }).weight_grams
                      ? `${(product as { weight_grams?: number }).weight_grams}g`
                      : null],
                    ["規格", product.specifications || product.package_spec],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={String(k)} className="flex gap-3 border-b border-[#E8E1D7]/80 py-2">
                        <dt className="w-20 shrink-0 text-[#667085]">{k}</dt>
                        <dd className="font-medium">{String(v)}</dd>
                      </div>
                    ))}
                </dl>
              ) : null}
              {tab === "shipping" ? (
                <div className="space-y-3 text-sm leading-relaxed text-[#334155]">
                  <p className="flex items-start gap-2">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0" />
                    支援門市取貨
                    {(product as { ship_home?: boolean }).ship_home !== false
                      ? "、宅配到府"
                      : ""}
                    。
                  </p>
                  <p>實際配送時程依庫存與門市作業時間為準。</p>
                </div>
              ) : null}
              {tab === "reviews" ? (
                <p className="text-sm text-[#667085]">評價功能準備中，歡迎先下單體驗商品品質。</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Related — full width below grid on desktop */}
        <div className="md:col-span-2 space-y-8 pt-2">
          {relatedRecipes.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-lg font-bold">用這項材料做什麼？</h3>
                <Link href="/recipes" className="text-sm font-semibold text-[#153E73] underline">
                  查看更多食譜
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {relatedRecipes.slice(0, 4).map((r) => {
                  const title = r.title || r.name || "食譜";
                  const href = r.slug ? `/recipes/${r.slug}` : `/recipes/${r.id}`;
                  const cover = r.cover_image_url || r.image_url || PRODUCT_IMAGE_FALLBACK;
                  return (
                    <Link
                      key={r.id}
                      href={href}
                      className="flex w-[82vw] max-w-[320px] shrink-0 gap-3 rounded-2xl border border-[#E8E1D7] bg-white p-3 md:w-[280px]"
                    >
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#F7F1E7]">
                        <SafeImage src={cover} alt={title} fill className="object-cover" sizes="96px" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                        <p className="line-clamp-2 text-sm font-bold">{title}</p>
                        <p className="text-xs text-[#667085]">
                          {[r.difficulty, r.total_minutes ? `${r.total_minutes} 分鐘` : null]
                            .filter(Boolean)
                            .join(" · ") || "查看食譜"}
                        </p>
                        <span className="text-xs font-semibold text-[#153E73]">查看食譜 →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}

          {relatedProducts.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-lg font-bold">經常一起購買</h3>
              <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {relatedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="w-[150px] shrink-0 overflow-hidden rounded-2xl border border-[#E8E1D7] bg-white"
                  >
                    <Link href={`/products/${p.id}`} className="block">
                      <div className="relative aspect-square bg-[#F7F1E7]">
                        <SafeImage
                          src={p.image_url || PRODUCT_IMAGE_FALLBACK}
                          alt={stripDemoPrefix(p.name)}
                          fill
                          className="object-contain"
                          sizes="150px"
                        />
                      </div>
                      <div className="space-y-1 p-2.5">
                        <p className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold">
                          {stripDemoPrefix(p.name)}
                        </p>
                        <p className="text-sm font-bold text-[#F16458]">
                          {formatCurrency(p.price)}
                        </p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      className="flex h-11 w-full items-center justify-center border-t border-[#E8E1D7] text-[#153E73]"
                      aria-label="加入購物車"
                      onClick={async () => {
                        try {
                          await addItem({
                            productId: p.id,
                            name: stripDemoPrefix(p.name),
                            price: Number(p.price),
                            quantity: 1,
                            imageUrl: p.image_url,
                          });
                          showToast("已加入購物車");
                        } catch (e) {
                          showToast(e instanceof Error ? e.message : "無法加入");
                        }
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {/* Mobile sticky buy bar */}
      <div
        className="fixed inset-x-0 z-40 border-t border-[#E8E1D7] bg-white/95 px-3 py-2 shadow-[0_-6px_24px_rgba(21,62,115,0.08)] backdrop-blur md:hidden"
        style={{
          bottom: "calc(var(--bottom-nav-height, 5rem) + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-[#667085]">售價</p>
            <p className="text-lg font-bold text-[#F16458]">{formatCurrency(displayPrice)}</p>
          </div>
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => void handleAdd(false)}
            className="flex h-12 min-w-[7.5rem] items-center justify-center rounded-full border-2 border-[#FEE169] bg-white px-3 text-sm font-bold text-[#153E73] disabled:opacity-40"
          >
            {outOfStock ? "補貨通知" : "加入購物車"}
          </button>
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => void handleAdd(true)}
            className="flex h-12 min-w-[7.5rem] items-center justify-center rounded-full bg-[#153E73] px-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {outOfStock ? "補貨通知" : "立即購買"}
          </button>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#153E73] px-4 py-2 text-sm font-semibold text-white shadow-lg md:bottom-8">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function IntroCard({ title, children }: { title: string; children: React.ReactNode }) {
  const text = typeof children === "string" ? children : null;
  return (
    <div className="rounded-xl border border-[#E8E1D7] bg-[#FFFEFA] p-3">
      <h3 className="mb-2 text-sm font-bold text-[#153E73]">{title}</h3>
      {text ? (
        looksLikeHtml(text) ? (
          <RichTextHtml html={text} />
        ) : (
          <div className="whitespace-pre-wrap text-sm text-[#475467]" style={{ lineHeight: 1.7 }}>
            {text}
          </div>
        )
      ) : (
        <div className="whitespace-pre-wrap text-sm text-[#475467]" style={{ lineHeight: 1.7 }}>
          {children}
        </div>
      )}
    </div>
  );
}
