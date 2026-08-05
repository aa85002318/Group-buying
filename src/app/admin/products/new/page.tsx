"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import type { GroupBuyCategory, ProductCategory, Store } from "@/lib/types/database";

type Brand = { id: string; name: string };
type Supplier = { id: string; name: string };

export default function AdminProductNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGroupBuyMode = searchParams.get("mode") === "group-buy";

  const [form, setForm] = useState<AdminProductFormV2>(() => {
    const base = emptyProductFormV2();
    if (isGroupBuyMode) {
      return { ...base, is_group_buy: true };
    }
    return base;
  });
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [groupBuyCategories, setGroupBuyCategories] = useState<GroupBuyCategory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backHref = useMemo(
    () => (isGroupBuyMode ? "/admin/group-buy/products" : "/admin/products"),
    [isGroupBuyMode]
  );

  useEffect(() => {
    // Keep mode in sync if query changes after mount
    setForm((prev) =>
      isGroupBuyMode
        ? { ...prev, is_group_buy: true }
        : prev.is_group_buy
          ? { ...prev, is_group_buy: false }
          : prev
    );
  }, [isGroupBuyMode]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories?catalog=baking-materials").then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
      fetch("/api/admin/suppliers").then((r) => r.json()),
      fetch("/api/admin/group-buy-categories").then((r) => r.json()),
    ])
      .then(([catRes, storeRes, brandRes, supplierRes, gbCatRes]) => {
        setCategories(catRes.categories ?? []);
        setStores(storeRes.stores ?? []);
        setBrands(brandRes.brands ?? []);
        setSuppliers(supplierRes.suppliers ?? []);
        setGroupBuyCategories(gbCatRes.categories ?? []);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    const nextForm = isGroupBuyMode ? { ...form, is_group_buy: true } : form;
    const validationError = validateProductFormV2(nextForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const base = formV2ToPayload(nextForm);
      const payload = isGroupBuyMode
        ? {
            ...base,
            is_group_buy: true,
            publish_group_buy: true,
            channels: ["group_buy", "website"],
          }
        : base;
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        title={isGroupBuyMode ? "團購新增" : "商品新增"}
        description={
          isGroupBuyMode
            ? "建立團購商品：需填寫團購區間、團購分類等欄位（共用商品主檔）"
            : "分區塊填寫商品資料，支援自動儲存與拖曳排序"
        }
        actions={
          <div className="flex gap-2">
            <Link href={backHref}>
              <Button variant="outline">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                返回列表
              </Button>
            </Link>
            <Button onClick={save} disabled={saving} className="bg-primary hover:bg-[#E63D6A]">
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "儲存中…" : isGroupBuyMode ? "儲存團購商品" : "儲存商品"}
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
        groupBuyCategories={groupBuyCategories}
        stores={stores}
        brands={brands}
        suppliers={suppliers}
        saving={saving}
        mode={isGroupBuyMode ? "group-buy" : "product"}
      />
    </div>
  );
}
