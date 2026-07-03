"use client";

import { useEffect, useState } from "react";
import { mockVideos, getMockRelatedProductsForVideo } from "@/lib/mock-data";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product, Video } from "@/lib/types/database";

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const [video, setVideo] = useState<Video | null>(mockVideos.find((v) => v.id === params.id) ?? null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(
    getMockRelatedProductsForVideo(params.id)
  );

  useEffect(() => {
    fetch(`/api/videos/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.video) setVideo(d.video);
        if (d.related_products?.length) setRelatedProducts(d.related_products);
      })
      .catch(() => {});
    fetch(`/api/videos/${params.id}/view`, { method: "POST" }).catch(() => {});
  }, [params.id]);

  if (!video) return <p>載入中...</p>;

  return (
    <div className="space-y-6">
      <div className="aspect-video overflow-hidden rounded-xl bg-black">
        <iframe src={video.video_url} className="h-full w-full" allowFullScreen title={video.title} />
      </div>
      <div>
        <h1 className="text-xl font-bold text-coffee">{video.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{video.description}</p>
        <p className="mt-1 text-xs text-coffee">{video.view_count} 次觀看</p>
      </div>

      {relatedProducts.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-coffee">推薦商品</h2>
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
