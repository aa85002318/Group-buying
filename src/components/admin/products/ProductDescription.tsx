"use client";

import Link from "next/link";
import { ProductContentBlockEditor } from "@/components/admin/products/ProductContentBlockEditor";
import type { AdminProductFormV2 } from "@/lib/admin/product-form-v2";

export function ProductDescription({
  form,
  patch,
}: {
  form: AdminProductFormV2;
  patch: (partial: Partial<AdminProductFormV2>) => void;
}) {
  return (
    <div className="space-y-4">
      <ProductContentBlockEditor
        title="③ 商品介紹"
        section="rich_description"
        value={form.rich_description}
        onChange={(rich_description) => patch({ rich_description })}
        footer={
          <p className="mt-2 text-xs text-[#8A94A6]">
            前台顯示於「商品特色」。公版可至{" "}
            <Link href="/admin/products/content-templates" className="text-[#153E73] underline">
              商品內容公版
            </Link>{" "}
            編輯。
          </p>
        }
      />
      <ProductContentBlockEditor
        title="適合用途"
        section="product_info"
        value={form.product_info}
        onChange={(product_info) => patch({ product_info })}
        footer={
          <p className="mt-2 text-xs text-[#8A94A6]">前台顯示於商品介紹分頁的「適合用途」。</p>
        }
      />
      <ProductContentBlockEditor
        title="商品規格"
        section="specifications"
        value={form.specifications}
        onChange={(specifications) => patch({ specifications })}
        footer={
          <p className="mt-2 text-xs text-[#8A94A6]">前台顯示於商品介紹分頁的「商品規格」。</p>
        }
      />
      <section className="rounded-xl border border-dashed border-gray-200 bg-[#FFFEFA] p-4">
        <h2 className="text-sm font-semibold text-[#153E73]">配送注意事項（全站公版）</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#8A94A6]">
          此區塊為全站共用，會出現在每一個商品頁的「配送注意事項」，請至配送說明公版編輯，無需在單一商品重複填寫。
        </p>
        <Link
          href="/admin/site-pages/shipping"
          className="mt-2 inline-block text-sm font-medium text-[#153E73] underline"
        >
          編輯配送說明公版 →
        </Link>
      </section>
    </div>
  );
}
