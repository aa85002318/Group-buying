"use client";

import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/products/ProductForm";

export default function AdminProductEditPage() {
  const params = useParams();
  const productId = String(params.id ?? "");
  return <ProductForm mode="edit" productId={productId} />;
}
