"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import {
  calcGrossMargin,
  type AdminProductFormState,
} from "@/lib/admin/product-form";
import { formatCurrency } from "@/lib/utils";
import type { ProductCategory, Store } from "@/lib/types/database";
import { cn } from "@/lib/utils";

function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("mb-1 block text-xs font-medium text-muted-foreground", className)}>{children}</label>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      <h3 className="text-sm font-semibold text-coffee">{title}</h3>
      {children}
    </section>
  );
}

type AdminProductFormProps = {
  form: AdminProductFormState;
  onChange: (form: AdminProductFormState) => void;
  categories: ProductCategory[];
  stores: Store[];
  saving?: boolean;
  onSave: () => void;
  onCancel: () => void;
  title: string;
};

export function AdminProductForm({
  form,
  onChange,
  categories,
  stores,
  saving,
  onSave,
  onCancel,
  title,
}: AdminProductFormProps) {
  const margin = calcGrossMargin(form.price, form.cost_price);
  const marginRate =
    margin != null && Number(form.price) > 0
      ? Math.round((margin / Number(form.price)) * 1000) / 10
      : null;

  const toggleStore = (storeId: string) => {
    const ids = form.pickup_store_ids.includes(storeId)
      ? form.pickup_store_ids.filter((id) => id !== storeId)
      : [...form.pickup_store_ids, storeId];
    onChange({ ...form, pickup_store_ids: ids });
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white p-4 shadow-card md:p-6">
      <h2 className="text-lg font-medium text-coffee">{title}</h2>

      <div className="mt-4 space-y-4">
        <Section title="基本資訊">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>商品名稱 *</FieldLabel>
              <Input
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                placeholder="請輸入商品名稱"
              />
            </div>
            <div>
              <FieldLabel>商品分類 *</FieldLabel>
              <select
                className="input-field w-full"
                value={form.category_id}
                onChange={(e) => onChange({ ...form, category_id: e.target.value })}
              >
                <option value="">選擇分類</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => onChange({ ...form, is_active: e.target.checked })}
                />
                上架中
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_group_buy}
                  onChange={(e) => onChange({ ...form, is_group_buy: e.target.checked })}
                />
                團購商品
              </label>
            </div>
          </div>
          <AdminImageUpload
            label="商品圖片"
            hint="可上傳多張圖片，第一張為主圖"
            images={form.images}
            onChange={(images) => onChange({ ...form, images })}
            uploadFolder="products"
          />
        </Section>

        <Section title="價格與庫存">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel>商品原價</FieldLabel>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.original_price}
                onChange={(e) => onChange({ ...form, original_price: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <FieldLabel>團購價 *</FieldLabel>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => onChange({ ...form, price: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <FieldLabel>成本價</FieldLabel>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.cost_price}
                onChange={(e) => onChange({ ...form, cost_price: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <FieldLabel>庫存數量 *</FieldLabel>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => onChange({ ...form, stock: e.target.value })}
              />
            </div>
          </div>
          <div className="rounded-lg bg-white px-3 py-2 text-sm text-coffee">
            毛利：
            {margin != null ? (
              <>
                <span className="font-medium text-primary">{formatCurrency(margin)}</span>
                {marginRate != null ? (
                  <span className="ml-2 text-muted-foreground">（毛利率 {marginRate}%）</span>
                ) : null}
              </>
            ) : (
              <span className="text-muted-foreground">請填寫團購價與成本價後自動計算</span>
            )}
          </div>
        </Section>

        {form.is_group_buy ? (
          <Section title="團購設定">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel>團購開始時間 *</FieldLabel>
                <Input
                  type="datetime-local"
                  value={form.group_buy_start_at}
                  onChange={(e) => onChange({ ...form, group_buy_start_at: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>團購結束時間 *</FieldLabel>
                <Input
                  type="datetime-local"
                  value={form.group_buy_end_at}
                  onChange={(e) => onChange({ ...form, group_buy_end_at: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>每人限購數量</FieldLabel>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={form.max_quantity_per_user}
                  onChange={(e) => onChange({ ...form, max_quantity_per_user: e.target.value })}
                  placeholder="不限制可留空"
                />
              </div>
            </div>
          </Section>
        ) : null}

        <Section title="取貨門市">
          {stores.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無可用門市，請至門市管理新增。</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stores.map((store) => {
                const selected = form.pickup_store_ids.includes(store.id);
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => toggleStore(store.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-white text-coffee hover:border-primary/40"
                    )}
                  >
                    {store.name}
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="供應商">
          <div>
            <FieldLabel>供應商名稱</FieldLabel>
            <Input
              value={form.supplier_name}
              onChange={(e) => onChange({ ...form, supplier_name: e.target.value })}
              placeholder="供應商或廠商名稱"
            />
          </div>
        </Section>

        <Section title="商品內容">
          <div>
            <FieldLabel>商品規格</FieldLabel>
            <textarea
              className="input-field min-h-[72px] w-full"
              value={form.specifications}
              onChange={(e) => onChange({ ...form, specifications: e.target.value })}
              placeholder="例：容量 500ml、重量 1kg、尺寸…"
            />
          </div>
          <div>
            <FieldLabel>商品描述</FieldLabel>
            <textarea
              className="input-field min-h-[100px] w-full"
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              placeholder="商品介紹、特色、使用方法…"
            />
          </div>
          <div>
            <FieldLabel>產品資訊</FieldLabel>
            <textarea
              className="input-field min-h-[80px] w-full"
              value={form.product_info}
              onChange={(e) => onChange({ ...form, product_info: e.target.value })}
              placeholder="成分、保存方式、注意事項、產地…"
            />
          </div>
        </Section>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onSave} disabled={saving || !form.name}>
            {saving ? "儲存中…" : "儲存商品"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
