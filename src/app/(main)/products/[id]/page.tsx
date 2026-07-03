import { Suspense } from "react";
import ProductDetailClient from "./ProductDetailClient";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<p className="text-center text-muted-foreground">載入中...</p>}>
      <ProductDetailClient id={params.id} />
    </Suspense>
  );
}
