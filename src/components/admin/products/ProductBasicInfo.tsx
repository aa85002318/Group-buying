"use client";

import { AdminField, AdminInput } from "@/components/admin/v2/AdminCard";
import { Button } from "@/components/ui/button";
import { generateDatedProductSku, type AdminProductFormV2, type ProductFormFieldErrors } from "@/lib/admin/product-form-v2";

export function ProductBasicInfo({
  form,
  patch,
  errors,
}: {
  form: AdminProductFormV2;
  patch: (partial: Partial<AdminProductFormV2>) => void;
  errors: ProductFormFieldErrors;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[#153E73]">① 基本資料</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <AdminField label="商品名稱" required className="md:col-span-2">
          <AdminInput value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="請輸入商品名稱" />
          {errors.name ? <p className="text-xs text-[#F16458]">{errors.name}</p> : null}
        </AdminField>
        <AdminField label="商品副標" className="md:col-span-2">
          <AdminInput value={form.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} placeholder="一句話賣點" />
        </AdminField>
        <AdminField label="SKU" required>
          <div className="flex gap-2">
            <AdminInput value={form.sku} onChange={(e) => patch({ sku: e.target.value })} />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => {
                if (form.sku.trim()) return;
                patch({ sku: generateDatedProductSku() });
              }}
            >
              自動產生
            </Button>
          </div>
          {form.sku.trim() ? (
            <p className="text-xs text-[#8A94A6]">已有 SKU 時不會自動覆蓋，請先清空再產生。</p>
          ) : null}
          {errors.sku ? <p className="text-xs text-[#F16458]">{errors.sku}</p> : null}
        </AdminField>
        <AdminField label="售價" required>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8A94A6]">NT$</span>
            <AdminInput
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => patch({ price: e.target.value })}
            />
          </div>
          {errors.price ? <p className="text-xs text-[#F16458]">{errors.price}</p> : null}
        </AdminField>
      </div>
    </section>
  );
}
