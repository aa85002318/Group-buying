"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VideoEmbed } from "@/components/videos/VideoEmbed";
import { ProductCard } from "@/components/products/ProductCard";
import { mockVideos, getMockRelatedProductsForVideo } from "@/lib/mock-data";
import type { Product, Video } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const idOrSlug = params.id;
  const [video, setVideo] = useState<Video | null>(
    mockVideos.find((v) => v.id === idOrSlug || v.slug === idOrSlug) ?? null
  );
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(
    getMockRelatedProductsForVideo(idOrSlug)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/videos/${encodeURIComponent(idOrSlug)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        if (d.video) setVideo(d.video);
        if (d.related_products?.length) setRelatedProducts(d.related_products);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));

    fetch(`/api/videos/${encodeURIComponent(idOrSlug)}/view`, { method: "POST" }).catch(() => {});
  }, [idOrSlug]);

  if (loading && !video) {
    return <div className="aspect-video animate-pulse rounded-[18px] bg-muted" />;
  }

  if (error || !video) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-foreground-secondary">{error ?? "找不到影音"}</p>
        <Link href="/videos" className="text-sm text-primary hover:underline">
          返回影音列表
        </Link>
      </div>
    );
  }

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : `/videos/${video.slug || video.id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <VideoEmbed url={video.video_url} title={video.title} />

      <div>
        {video.category && (
          <p className="text-xs font-medium text-caramel">{video.category}</p>
        )}
        <h1 className="mt-1 text-2xl font-bold text-caramel">{video.title}</h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          {video.summary || video.description}
        </p>
        <p className="mt-2 text-xs text-foreground-secondary">
          {video.published_at || video.created_at
            ? formatDate(video.published_at || video.created_at)
            : ""}
          {` · ${video.view_count ?? 0} 次觀看`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-11 rounded-2xl border border-border-soft bg-surface px-4 text-sm font-medium text-caramel"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: video.title, url: shareUrl }).catch(() => {});
            } else if (navigator.clipboard) {
              navigator.clipboard.writeText(shareUrl);
              alert("已複製連結");
            }
          }}
        >
          分享
        </button>
        <Link
          href="/member/favorites"
          className="inline-flex min-h-11 items-center rounded-2xl bg-primary-soft px-4 text-sm font-medium text-primary"
        >
          收藏
        </Link>
        <Link href="/recipes" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">
          瀏覽相關食譜 →
        </Link>
      </div>

      {relatedProducts.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-caramel">相關商品</h2>
          <div className="grid grid-cols-2 gap-3">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price}
                original_price={p.original_price}
                image_url={p.image_url}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
