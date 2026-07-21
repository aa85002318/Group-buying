"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminProductEditor } from "@/components/admin/v2/AdminProductEditor";
import { Button } from "@/components/ui/button";
import {
  emptyProductFormV2,
  formV2ToPayload,
  productToFormV2,
  validateProductFormV2,
  type AdminProductFormV2,
} from "@/lib/admin/product-form-v2";
import type { ProductCategory, Store } from "@/lib/types/database";

type Brand = { id: string; name: string };
type Supplier = { id: string; name: string };

export default function AdminProductEditPage() {
  const params = useParams();
  const productId = params.id as string;

  const [form, setForm] = useState<AdminProductFormV2>(emptyProductFormV2());
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories?catalog=baking-materials").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
      fetch("/api/admin/suppliers").then((r) => r.json()),
      fetch("/api/admin/products").then((r) => r.json()),
    ])
      .then(([bakingRes, allCatRes, storeRes, brandRes, supplierRes, productRes]) => {
        const merged = new Map<string, ProductCategory>();
        for (const c of [
          ...((bakingRes.categories ?? []) as ProductCategory[]),
          ...((allCatRes.categories ?? []) as ProductCategory[]),
        ]) {
          merged.set(c.id, c);
        }
        setCategories(Array.from(merged.values()));
        setStores(storeRes.stores ?? []);
        setBrands(brandRes.brands ?? []);
        setSuppliers(supplierRes.suppliers ?? []);
        const product = (productRes.products ?? []).find(
          (p: { id: string }) => p.id === productId
        );
        if (product) setForm(productToFormV2(product));
        else setError("找不到商品");
      })
      .catch(() => setError("載入失敗"))
      .finally(() => setLoading(false));
  }, [productId]);

  const persist = useCallback(async (nextForm: AdminProductFormV2) => {
    const res = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, ...formV2ToPayload(nextForm) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "儲存失敗");
  }, [productId]);

  const save = async () => {
    const validationError = validateProductFormV2(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await persist(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-foreground-secondary">載入中…</p>;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`編輯商品：${form.name || "未命名"}`}
        description="修改後會自動儲存，也可手動儲存"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/products">
              <Button variant="outline">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                返回列表
              </Button>
            </Link>
            <Link href={`/admin/products/${productId}/analysis`}>
              <Button variant="outline">查看分析</Button>
            </Link>
            <Button onClick={save} disabled={saving} className="bg-primary hover:bg-[#E63D6A]">
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "儲存中…" : "儲存商品"}
            </Button>
          </div>
        }
      />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <AdminProductEditor
        form={form}
        onChange={setForm}
        categories={categories}
        stores={stores}
        brands={brands}
        suppliers={suppliers}
        productId={productId}
        onAutoSave={persist}
        saving={saving}
      />
    </div>
  );
}
