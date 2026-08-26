"use client";

import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  AdminCheckbox,
  AdminField,
  AdminInput,
  AdminRadioGroup,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/v2/AdminCard";
import { Button } from "@/components/ui/button";
import { sortNamedOptions } from "@/lib/admin/category-tree";
import {
  calcGrossMarginAmount,
  calcGrossMarginRate,
  createEmptyBatch,
  createEmptyVariant,
  createEmptyVideo,
  type AdminProductFormV2,
} from "@/lib/admin/product-form-v2";
import { formatCurrency } from "@/lib/utils";
import type { GroupBuyCategory, ProductScope, Store } from "@/lib/types/database";

function Accordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[#153E73]"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <span className="text-[#8A94A6]">{open ? "∧" : "∨"}</span>
      </button>
      {open ? <div className="space-y-4 border-t border-gray-200 p-4">{children}</div> : null}
    </div>
  );
}

type Brand = { id: string; name: string };
type Supplier = { id: string; name: string };

export function ProductAdvancedSettings({
  form,
  patch,
  stores,
  brands,
  suppliers,
  groupBuyCategories,
  lockGroupBuy,
  productId,
  createdAt,
  updatedAt,
}: {
  form: AdminProductFormV2;
  patch: (partial: Partial<AdminProductFormV2>) => void;
  stores: Store[];
  brands: Brand[];
  suppliers: Supplier[];
  groupBuyCategories: GroupBuyCategory[];
  lockGroupBuy: boolean;
  productId?: string;
  createdAt?: string;
  updatedAt?: string;
}) {
  const marginAmount = calcGrossMarginAmount(form.price, form.cost_price);
  const marginRate = calcGrossMarginRate(form.price, form.cost_price);
  const sortedBrands = sortNamedOptions(brands);
  const sortedSuppliers = sortNamedOptions(suppliers);

  return (
    <div className="space-y-3">
      <Accordion title="規格 / 變體">
        {form.variants.map((variant, index) => (
          <div key={variant.id} className="grid gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-4">
            <AdminField label="規格名稱">
              <AdminInput
                value={variant.name}
                onChange={(e) => {
                  const variants = [...form.variants];
                  variants[index] = { ...variant, name: e.target.value };
                  patch({ variants });
                }}
              />
            </AdminField>
            <AdminField label="規格值">
              <AdminInput
                value={variant.value}
                onChange={(e) => {
                  const variants = [...form.variants];
                  variants[index] = { ...variant, value: e.target.value };
                  patch({ variants });
                }}
              />
            </AdminField>
            <AdminField label="加價">
              <AdminInput
                type="number"
                value={variant.price_adjustment}
                onChange={(e) => {
                  const variants = [...form.variants];
                  variants[index] = { ...variant, price_adjustment: e.target.value };
                  patch({ variants });
                }}
              />
            </AdminField>
            <div className="flex items-end">
              <Button type="button" size="sm" variant="outline" onClick={() => patch({ variants: form.variants.filter((v) => v.id !== variant.id) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => patch({ variants: [...form.variants, createEmptyVariant()] })}>
          <Plus className="mr-1 h-4 w-4" />新增規格
        </Button>
      </Accordion>

      <Accordion title="SEO 設定">
        <AdminField label="SEO Title">
          <AdminInput value={form.seo_title} onChange={(e) => patch({ seo_title: e.target.value })} />
          <p className="text-xs text-muted-foreground">建議 30～60 字元（目前 {form.seo_title.length}）</p>
        </AdminField>
        <AdminField label="Meta Description">
          <AdminTextarea value={form.seo_description} onChange={(e) => patch({ seo_description: e.target.value })} />
          <p className="text-xs text-muted-foreground">建議 70～160 字元（目前 {form.seo_description.length}）</p>
        </AdminField>
        <AdminField label="Slug">
          <AdminInput value={form.slug} onChange={(e) => patch({ slug: e.target.value })} />
        </AdminField>
        <AdminField label="SEO Keywords">
          <AdminInput value={form.seo_keywords} onChange={(e) => patch({ seo_keywords: e.target.value })} />
        </AdminField>
      </Accordion>

      <Accordion title="更多價格設定">
        <div className="grid gap-4 md:grid-cols-3">
          <AdminField label="原價">
            <AdminInput type="number" min={0} value={form.original_price} onChange={(e) => patch({ original_price: e.target.value })} />
          </AdminField>
          <AdminField label="直播價">
            <AdminInput type="number" min={0} value={form.live_price} onChange={(e) => patch({ live_price: e.target.value })} />
          </AdminField>
          <AdminField label="VIP 價">
            <AdminInput type="number" min={0} value={form.vip_price} onChange={(e) => patch({ vip_price: e.target.value })} />
          </AdminField>
          <AdminField label="成本">
            <AdminInput type="number" min={0} value={form.cost_price} onChange={(e) => patch({ cost_price: e.target.value })} />
          </AdminField>
          <div className="flex flex-col justify-end rounded-xl bg-[#F7F8FA] p-3">
            <p className="text-xs text-[#8A94A6]">毛利率</p>
            <p className="text-lg font-semibold">{marginRate != null ? `${marginRate}%` : "—"}</p>
            {marginAmount != null ? <p className="text-sm">毛利 {formatCurrency(marginAmount)}</p> : null}
          </div>
        </div>
      </Accordion>

      <Accordion title="進階庫存設定">
        <AdminField label="商品模式">
          <AdminRadioGroup
            value={form.inventory_mode}
            onChange={(inventory_mode) => patch({ inventory_mode })}
            options={[
              { value: "stock", label: "現貨" },
              { value: "preorder", label: "預購" },
              { value: "both", label: "現貨＋預購" },
            ]}
          />
        </AdminField>
        <div className="grid gap-4 md:grid-cols-3">
          <AdminField label="安全庫存">
            <AdminInput type="number" value={form.safety_stock} onChange={(e) => patch({ safety_stock: e.target.value })} />
          </AdminField>
          <AdminField label="最低庫存警示">
            <AdminInput type="number" value={form.min_stock_alert} onChange={(e) => patch({ min_stock_alert: e.target.value })} />
          </AdminField>
          <AdminField label="預購庫存">
            <AdminInput type="number" value={form.preorder_stock} onChange={(e) => patch({ preorder_stock: e.target.value })} />
          </AdminField>
        </div>
        <AdminField label="預計到貨日期">
          <AdminInput type="date" value={form.expected_arrival_date} onChange={(e) => patch({ expected_arrival_date: e.target.value })} />
        </AdminField>
        <AdminField label="預購說明">
          <AdminTextarea value={form.preorder_note} onChange={(e) => patch({ preorder_note: e.target.value })} />
        </AdminField>
        <AdminCheckbox label="售出自動扣庫存" checked={form.auto_deduct_stock} onChange={(v) => patch({ auto_deduct_stock: v })} />
        <AdminCheckbox label="允許超賣" checked={form.allow_oversell} onChange={(v) => patch({ allow_oversell: v })} />
      </Accordion>

      <Accordion title="配送進階設定">
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="重量 (g)">
            <AdminInput type="number" value={form.weight_grams} onChange={(e) => patch({ weight_grams: e.target.value })} />
          </AdminField>
          <AdminField label="尺寸">
            <AdminInput value={form.dimensions} onChange={(e) => patch({ dimensions: e.target.value })} />
          </AdminField>
        </div>
        {stores.length > 0 ? (
          <AdminField label="可取貨門市">
            <div className="flex flex-wrap gap-2">
              {stores.map((store) => (
                <AdminCheckbox
                  key={store.id}
                  label={store.name}
                  checked={form.pickup_store_ids.includes(store.id)}
                  onChange={(checked) => {
                    const ids = checked
                      ? [...form.pickup_store_ids, store.id]
                      : form.pickup_store_ids.filter((id) => id !== store.id);
                    patch({ pickup_store_ids: ids });
                  }}
                />
              ))}
            </div>
          </AdminField>
        ) : null}
      </Accordion>

      <Accordion title="其他進階設定">
        <AdminField label="商品領域">
          <AdminRadioGroup<ProductScope>
            value={form.product_scope}
            onChange={(product_scope) => patch({ product_scope })}
            options={[
              { value: "baking", label: "烘焙材料" },
              { value: "chime_select", label: "CHIME 精選" },
            ]}
          />
        </AdminField>
        <AdminField label="品牌">
          <AdminSelect value={form.brand_id} onChange={(e) => patch({ brand_id: e.target.value })}>
            <option value="">選擇品牌</option>
            {sortedBrands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </AdminSelect>
        </AdminField>
        <AdminField label="供應商">
          <AdminSelect value={form.supplier_id} onChange={(e) => patch({ supplier_id: e.target.value })}>
            <option value="">選擇供應商</option>
            {sortedSuppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </AdminSelect>
        </AdminField>
        <AdminField label="排序">
          <AdminInput type="number" value={form.sort_order} onChange={(e) => patch({ sort_order: e.target.value })} />
        </AdminField>
        <div className="grid gap-2 sm:grid-cols-2">
          <AdminCheckbox label="首頁推薦" checked={form.is_featured} onChange={(v) => patch({ is_featured: v })} />
          <AdminCheckbox label="HOT 熱門" checked={form.is_hot} onChange={(v) => patch({ is_hot: v })} />
          <AdminCheckbox label="NEW 新品" checked={form.is_new} onChange={(v) => patch({ is_new: v })} />
          <AdminCheckbox label="本週精選" checked={form.is_weekly_pick} onChange={(v) => patch({ is_weekly_pick: v })} />
          <AdminCheckbox label="即將收單" checked={form.is_closing_soon} onChange={(v) => patch({ is_closing_soon: v })} />
          <AdminCheckbox
            label="團購商品"
            checked={lockGroupBuy ? true : form.is_group_buy}
            onChange={(v) => {
              if (lockGroupBuy) return;
              patch({ is_group_buy: v });
            }}
            disabled={lockGroupBuy}
          />
        </div>
        {(form.is_hot || form.is_new) && (
          <div className="grid gap-4 md:grid-cols-2">
            {form.is_hot ? (
              <AdminField label="熱門排序">
                <AdminInput type="number" value={form.hot_sort_order} onChange={(e) => patch({ hot_sort_order: e.target.value })} />
              </AdminField>
            ) : null}
            {form.is_new ? (
              <>
                <AdminField label="新品排序">
                  <AdminInput type="number" value={form.new_sort_order} onChange={(e) => patch({ new_sort_order: e.target.value })} />
                </AdminField>
                <AdminField label="新品到期">
                  <AdminInput type="datetime-local" value={form.new_until} onChange={(e) => patch({ new_until: e.target.value })} />
                </AdminField>
              </>
            ) : null}
          </div>
        )}
        {(lockGroupBuy || form.is_group_buy) && (
          <div className="grid gap-4 md:grid-cols-2">
            <AdminField label="團購開始" required>
              <AdminInput type="datetime-local" value={form.group_buy_start_at} onChange={(e) => patch({ group_buy_start_at: e.target.value })} />
            </AdminField>
            <AdminField label="團購結束" required>
              <AdminInput type="datetime-local" value={form.group_buy_end_at} onChange={(e) => patch({ group_buy_end_at: e.target.value })} />
            </AdminField>
            <AdminField label="團購分類" className="md:col-span-2">
              <AdminSelect value={form.group_buy_category_id} onChange={(e) => patch({ group_buy_category_id: e.target.value })}>
                <option value="">選擇團購分類</option>
                {groupBuyCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminCheckbox label="本月團購" checked={form.is_monthly_group_buy} onChange={(v) => patch({ is_monthly_group_buy: v })} />
            <AdminCheckbox label="限定商品" checked={form.is_limited_product} onChange={(v) => patch({ is_limited_product: v })} />
            <AdminField label="每人限購">
              <AdminInput type="number" value={form.max_quantity_per_user} onChange={(e) => patch({ max_quantity_per_user: e.target.value })} />
            </AdminField>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">商品影片</p>
          <Button type="button" size="sm" variant="secondary" onClick={() => patch({ videos: [...form.videos, createEmptyVideo()] })}>
            新增影片
          </Button>
        </div>
        {form.videos.map((video, index) => (
          <div key={video.id} className="grid gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-2">
            <AdminField label="標題">
              <AdminInput value={video.title} onChange={(e) => {
                const videos = [...form.videos];
                videos[index] = { ...video, title: e.target.value };
                patch({ videos });
              }} />
            </AdminField>
            <AdminField label="網址" className="md:col-span-2">
              <AdminInput value={video.url} onChange={(e) => {
                const videos = [...form.videos];
                videos[index] = { ...video, url: e.target.value };
                patch({ videos });
              }} />
            </AdminField>
            <Button type="button" size="sm" variant="outline" onClick={() => patch({ videos: form.videos.filter((v) => v.id !== video.id) })}>
              刪除
            </Button>
          </div>
        ))}
        <p className="text-sm font-semibold">批次管理</p>
        {form.batches.map((batch, index) => (
          <div key={batch.id} className="grid gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-3">
            <AdminField label="批號">
              <AdminInput value={batch.batch_number} onChange={(e) => {
                const batches = [...form.batches];
                batches[index] = { ...batch, batch_number: e.target.value };
                patch({ batches });
              }} />
            </AdminField>
            <AdminField label="效期">
              <AdminInput type="date" value={batch.expiry_date} onChange={(e) => {
                const batches = [...form.batches];
                batches[index] = { ...batch, expiry_date: e.target.value };
                patch({ batches });
              }} />
            </AdminField>
            <div className="flex items-end">
              <Button type="button" size="sm" variant="outline" onClick={() => patch({ batches: form.batches.filter((b) => b.id !== batch.id) })}>
                刪除
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => patch({ batches: [...form.batches, createEmptyBatch()] })}>
          新增批次
        </Button>
        <AdminField label="商品標籤">
          <AdminInput
            placeholder="輸入標籤後按 Enter"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const tag = e.currentTarget.value.trim();
              if (!tag || form.tags.includes(tag)) return;
              patch({ tags: [...form.tags, tag] });
              e.currentTarget.value = "";
            }}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="rounded-full bg-[#F7F8FA] px-3 py-1 text-xs"
                onClick={() => patch({ tags: form.tags.filter((t) => t !== tag) })}
              >
                {tag} ×
              </button>
            ))}
          </div>
        </AdminField>
      </Accordion>

      {productId ? (
        <Accordion title="系統資訊">
          <p className="text-sm text-[#8A94A6]">商品 ID</p>
          <p className="font-mono text-xs">{productId}</p>
          {createdAt ? <p className="text-xs text-[#8A94A6]">建立時間 {createdAt}</p> : null}
          {updatedAt ? <p className="text-xs text-[#8A94A6]">最後更新 {updatedAt}</p> : null}
        </Accordion>
      ) : null}
    </div>
  );
}
