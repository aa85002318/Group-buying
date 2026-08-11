import { Suspense } from "react";
import ProductDetailClient from "@/app/(main)/products/[id]/ProductDetailClient";

export default function ShopProductDetailPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<p className="text-center text-muted-foreground">載入中...</p>}>
      <ProductDetailClient id={params.slug} />
    </Suspense>
  );
}
