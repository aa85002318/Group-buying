"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductForm } from "@/components/admin/products/ProductForm";

function NewProductInner() {
  const searchParams = useSearchParams();
  const groupBuy = searchParams.get("mode") === "group-buy";
  return <ProductForm mode="create" groupBuy={groupBuy} />;
}

export function AdminProductNewClient() {
  return (
    <Suspense fallback={<p className="text-sm text-[#8A94A6]">載入中…</p>}>
      <NewProductInner />
    </Suspense>
  );
}
