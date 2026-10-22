"use client";

import Link from "next/link";
import { AdminCheckbox, AdminField, AdminInput, AdminRadioGroup } from "@/components/admin/v2/AdminCard";
import { CategoryGroupedPicker } from "@/components/admin/CategoryGroupedPicker";
import { isShipmentMethodOpen } from "@/lib/checkout/shipment-options";
import type { AdminProductFormV2, ProductFormFieldErrors } from "@/lib/admin/product-form-v2";
import type { ProductCategory, ProductStatus } from "@/lib/types/database";

export function ProductQuickSettings({
  form,
  patch,
  categories,
  errors,
  salesModeSupported = true,
}: {
  form: AdminProductFormV2;
  patch: (partial: Partial<AdminProductFormV2>) => void;
  categories: ProductCategory[];
  errors: ProductFormFieldErrors;
  /** false = 這個環境的資料庫還沒有 sales_mode 欄位，這個設定存不進去。 */
  salesModeSupported?: boolean;
}) {
  // 整站層級的物流開關，跟單一商品勾了什麼是兩件事。
  const homeOpen = isShipmentMethodOpen("home_delivery");
  const cvsOpen = isShipmentMethodOpen("cvs_pickup");

  return (
    <aside className="space-y-4 lg:sticky lg:top-20">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#153E73]">商品狀態</h2>
        <AdminRadioGroup<ProductStatus>
          value={form.status}
          onChange={(status) => patch({ status })}
          options={[
            { value: "active", label: "上架（公開顯示）" },
            { value: "inactive", label: "下架（暫不顯示）" },
            { value: "draft", label: "草稿（僅儲存）" },
            { value: "sold_out", label: "售完" },
          ]}
        />
      </section>
      {salesModeSupported ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#153E73]">銷售方式</h2>
          <AdminRadioGroup<"sell" | "inquiry">
            value={form.sales_mode}
            onChange={(sales_mode) => patch({ sales_mode })}
            options={[
              { value: "sell", label: "直接販售（可加入購物車）" },
              { value: "inquiry", label: "僅供詢價（隱藏價格）" },
            ]}
          />
          {form.sales_mode === "inquiry" ? (
            <p className="mt-2 rounded-lg bg-[#FFF7E0] px-3 py-2 text-xs leading-relaxed text-[#8A6A00]">
              前台不顯示價格、不能下單，客戶只能「加入詢價單」。送出後會進到後台的
              「詢價管理」，可以直接轉成報價單回覆。
            </p>
          ) : null}
        </section>
      ) : (
        // 資料庫還沒有 sales_mode 欄位。顯示切換鈕只會讓人按了以為有存到，
        // 所以改成說清楚現在的狀態。
        <section className="rounded-xl border border-dashed border-gray-300 bg-[#FAFAFA] p-4">
          <h2 className="text-sm font-semibold text-[#8A94A6]">銷售方式</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#8A94A6]">
            這個環境尚未啟用「商品詢價」，目前所有商品都是直接販售。需要開通請先執行
            詢價功能的資料庫 migration。
          </p>
        </section>
      )}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#153E73]">商品分類</h2>
        <CategoryGroupedPicker
          categories={categories}
          selectedIds={form.category_ids}
          onChange={(category_ids) => patch({ category_ids })}
          title="選擇分類"
        />
        {errors.category ? <p className="mt-2 text-xs text-[#F16458]">{errors.category}</p> : null}
        <Link href="/admin/categories" className="mt-2 inline-block text-xs text-[#153E73] underline">
          ＋ 新增分類
        </Link>
      </section>
      {/* 配送方式與保存溫層原本混在同一組勾選裡，但它們是兩回事：
          配送方式決定客戶結帳時能選什麼，溫層決定能不能合併宅配。分開比較不會勾錯。 */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#153E73]">配送方式</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-[#8A94A6]">
          勾選的方式會顯示在前台商品頁的「配送與取貨」。
        </p>
        <div className="mt-2 space-y-2">
          <AdminCheckbox
            label="門市取貨"
            checked={form.ship_store_pickup}
            onChange={(v) => patch({ ship_store_pickup: v })}
          />
          <AdminCheckbox label="宅配" checked={form.ship_home} onChange={(v) => patch({ ship_home: v })} />
          <AdminCheckbox label="超商取貨" checked={form.ship_cvs} onChange={(v) => patch({ ship_cvs: v })} />
        </div>
        {!homeOpen || !cvsOpen ? (
          <p className="mt-2 rounded-lg bg-[#FFF7E0] px-3 py-2 text-[11px] leading-relaxed text-[#8A6A00]">
            目前整站只開通「門市取貨」。
            {[!homeOpen ? "宅配" : null, !cvsOpen ? "超商取貨" : null].filter(Boolean).join("、")}
            勾選後，前台會標示「即將開放」，客戶結帳時還選不到。
          </p>
        ) : null}
      </section>
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#153E73]">保存溫層</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-[#8A94A6]">
          不同溫層的商品無法合併宅配，客戶需分開下單；門市取貨可合併。
        </p>
        <div className="mt-2 space-y-2">
          <AdminCheckbox label="常溫" checked={form.temp_ambient} onChange={(v) => patch({ temp_ambient: v })} />
          <AdminCheckbox label="冷藏" checked={form.temp_chilled} onChange={(v) => patch({ temp_chilled: v })} />
          <AdminCheckbox label="冷凍" checked={form.temp_frozen} onChange={(v) => patch({ temp_frozen: v })} />
        </div>
      </section>
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#153E73]">庫存</h2>
        <AdminField label="庫存數量">
          <AdminInput type="number" min={0} value={form.stock} onChange={(e) => patch({ stock: e.target.value })} />
        </AdminField>
      </section>
    </aside>
  );
}
