"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminProductEditor } from "@/components/admin/v2/AdminProductEditor";
import { Button } from "@/components/ui/button";
import {
  emptyProductFormV2,
  formV2ToPayload,
  validateProductFormV2,
  type AdminProductFormV2,
} from "@/lib/admin/product-form-v2";
import type { ProductCategory, Store } from "@/lib/types/database";

type Brand = { id: string; name: string };
type Supplier = { id: string; name: string };

export default function AdminProductNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<AdminProductFormV2>(emptyProductFormV2());
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
      fetch("/api/admin/suppliers").then((r) => r.json()),
    ])
      .then(([catRes, storeRes, brandRes, supplierRes]) => {
        setCategories(catRes.categories ?? []);
        setStores(storeRes.stores ?? []);
        setBrands(brandRes.brands ?? []);
        setSuppliers(supplierRes.suppliers ?? []);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    const validationError = validateProductFormV2(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formV2ToPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      router.push(`/admin/products/${data.product.id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="新增商品"
        description="分區塊填寫商品資料，支援自動儲存與拖曳排序"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/products">
              <Button variant="outline">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                返回列表
              </Button>
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
        saving={saving}
      />
    </div>
  );
}
