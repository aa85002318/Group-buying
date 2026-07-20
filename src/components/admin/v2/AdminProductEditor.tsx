"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Boxes,
  DollarSign,
  FileText,
  GripVertical,
  ImageIcon,
  Package,
  Plus,
  Search,
  Settings2,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { Button } from "@/components/ui/button";
import {
  AdminCard,
  AdminCheckbox,
  AdminField,
  AdminInput,
  AdminRadioGroup,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/v2/AdminCard";
import {
  calcGrossMarginAmount,
  calcGrossMarginRate,
  createEmptyBatch,
  createEmptyVariant,
  createEmptyVideo,
  type AdminProductFormV2,
} from "@/lib/admin/product-form-v2";
import { formatCurrency } from "@/lib/utils";
import type { ProductCategory, ProductStatus, Store } from "@/lib/types/database";

type Brand = { id: string; name: string };
type Supplier = { id: string; name: string };

type AdminProductEditorProps = {
  form: AdminProductFormV2;
  onChange: (form: AdminProductFormV2) => void;
  categories: ProductCategory[];
  stores: Store[];
  brands: Brand[];
  suppliers: Supplier[];
  productId?: string;
  onAutoSave?: (form: AdminProductFormV2) => Promise<void>;
  saving?: boolean;
};

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const tag = input.trim();
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag]);
    setInput("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-[#FFF0F5] px-3 py-1 text-xs font-semibold text-[#FF4F7B]"
          >
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <AdminInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入標籤後按 Enter"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={add}>
          新增
        </Button>
      </div>
    </div>
  );
}

function MediaGallery({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "product-images");
      formData.append("folder", "products");
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) onChange([...images, data.url]);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (targetIndex: number) => {
    const from = dragIndex.current;
    if (from === null || from === targetIndex) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    dragIndex.current = null;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {images.map((url, index) => (
          <div
            key={`${url}-${index}`}
            draggable
            onDragStart={() => { dragIndex.current = index; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className="group relative overflow-hidden rounded-2xl border border-[#E8EBF4] bg-[#F7F8FC]"
          >
            <div className="relative aspect-square">
              <Image src={url} alt="" fill className="object-cover" unoptimized />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-[#FF4F7B] px-2 py-0.5 text-[10px] font-bold text-white">
                  主圖
                </span>
              )}
              <span className="absolute left-2 bottom-2 rounded bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100">
                <GripVertical className="h-4 w-4" />
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange(images.filter((_, i) => i !== index))}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-red-500 shadow"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {images.length < 20 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#FF4F7B]/40 bg-[#FFF8FA] text-sm font-semibold text-[#FF4F7B] transition hover:border-[#FF4F7B] hover:bg-[#FFF0F5]"
          >
            <ImageIcon className="h-6 w-6" />
            {uploading ? "上傳中…" : "新增圖片"}
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (!files) return;
          Array.from(files)
            .slice(0, 20 - images.length)
            .forEach((f) => uploadFile(f));
          e.target.value = "";
        }}
      />
      <p className="text-xs text-[#94A3B8]">最多 20 張，支援 JPG / PNG / WebP。拖曳可排序，第一張為主圖。</p>
    </div>
  );
}

export function AdminProductEditor({
  form,
  onChange,
  categories,
  stores,
  brands,
  suppliers,
  productId,
  onAutoSave,
  saving,
}: AdminProductEditorProps) {
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const patch = useCallback(
    (partial: Partial<AdminProductFormV2>) => onChange({ ...form, ...partial }),
    [form, onChange]
  );

  useEffect(() => {
    if (!productId || !onAutoSave) return;
    const timer = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        await onAutoSave(form);
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      } catch {
        setAutoSaveStatus("idle");
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [form, productId, onAutoSave]);

  const marginAmount = calcGrossMarginAmount(form.price, form.cost_price);
  const marginRate = calcGrossMarginRate(form.price, form.cost_price);

  const toggleCategory = (id: string) => {
    const ids = form.category_ids.includes(id)
      ? form.category_ids.filter((c) => c !== id)
      : [...form.category_ids, id];
    patch({ category_ids: ids });
  };

  return (
    <div className="space-y-5">
      {productId && onAutoSave && (
        <p className="text-right text-xs text-[#94A3B8]">
          {autoSaveStatus === "saving" && "自動儲存中…"}
          {autoSaveStatus === "saved" && "已自動儲存"}
          {autoSaveStatus === "idle" && saving && "儲存中…"}
        </p>
      )}

      <AdminCard title="基本資料" description="商品名稱、分類與上架狀態" icon={<Package className="h-5 w-5" />}>
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="商品名稱" required className="md:col-span-2">
            <AdminInput value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="請輸入商品名稱" />
          </AdminField>
          <AdminField label="商品副標">
            <AdminInput value={form.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} placeholder="一句話賣點" />
          </AdminField>
          <AdminField label="商品 SKU" hint="可修改，留空將自動產生">
            <AdminInput value={form.sku} onChange={(e) => patch({ sku: e.target.value })} />
          </AdminField>
          <AdminField label="商品分類" required className="md:col-span-2">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    form.category_ids.includes(c.id)
                      ? "bg-[#FF4F7B] text-white"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#FFF0F5] hover:text-[#FF4F7B]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </AdminField>
          <AdminField label="品牌">
            <AdminSelect value={form.brand_id} onChange={(e) => patch({ brand_id: e.target.value })}>
              <option value="">選擇品牌</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="供應商">
            <AdminSelect value={form.supplier_id} onChange={(e) => patch({ supplier_id: e.target.value })}>
              <option value="">選擇供應商</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="商品狀態">
            <AdminRadioGroup<ProductStatus>
              value={form.status}
              onChange={(status) => patch({ status })}
              options={[
                { value: "active", label: "上架" },
                { value: "inactive", label: "下架" },
                { value: "draft", label: "草稿" },
              ]}
            />
          </AdminField>
          <AdminField label="商品排序">
            <AdminInput type="number" value={form.sort_order} onChange={(e) => patch({ sort_order: e.target.value })} />
          </AdminField>
          <div className="grid gap-2 sm:grid-cols-2 md:col-span-2">
            <AdminCheckbox label="首頁推薦" checked={form.is_featured} onChange={(v) => patch({ is_featured: v })} />
            <AdminCheckbox label="熱門商品" checked={form.is_hot} onChange={(v) => patch({ is_hot: v })} />
            <AdminCheckbox label="新品" checked={form.is_new} onChange={(v) => patch({ is_new: v })} />
            <AdminCheckbox label="本週精選" checked={form.is_weekly_pick} onChange={(v) => patch({ is_weekly_pick: v })} />
            <AdminCheckbox label="即將收單" checked={form.is_closing_soon} onChange={(v) => patch({ is_closing_soon: v })} />
            <AdminCheckbox label="團購商品" checked={form.is_group_buy} onChange={(v) => patch({ is_group_buy: v })} />
          </div>
          {form.is_group_buy && (
            <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
              <AdminField label="團購開始">
                <AdminInput type="datetime-local" value={form.group_buy_start_at} onChange={(e) => patch({ group_buy_start_at: e.target.value })} />
              </AdminField>
              <AdminField label="團購結束">
                <AdminInput type="datetime-local" value={form.group_buy_end_at} onChange={(e) => patch({ group_buy_end_at: e.target.value })} />
              </AdminField>
              <AdminField label="每人限購">
                <AdminInput type="number" value={form.max_quantity_per_user} onChange={(e) => patch({ max_quantity_per_user: e.target.value })} />
              </AdminField>
            </div>
          )}
        </div>
      </AdminCard>

      <AdminCard title="商品媒體" description="圖片與影片，支援拖曳排序" icon={<ImageIcon className="h-5 w-5" />}>
        <MediaGallery images={form.images} onChange={(images) => patch({ images })} />
        <div className="mt-6 space-y-3 border-t border-[#EEF1F8] pt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#334155]">商品影片</p>
            <Button type="button" size="sm" variant="secondary" onClick={() => patch({ videos: [...form.videos, createEmptyVideo()] })}>
              <Plus className="mr-1 h-4 w-4" />新增影片
            </Button>
          </div>
          {form.videos.map((video, index) => (
            <div key={video.id} className="grid gap-3 rounded-2xl border border-[#EEF1F8] bg-[#F7F8FC] p-4 md:grid-cols-2">
              <AdminField label="標題">
                <AdminInput value={video.title} onChange={(e) => {
                  const videos = [...form.videos];
                  videos[index] = { ...video, title: e.target.value };
                  patch({ videos });
                }} />
              </AdminField>
              <AdminField label="類型">
                <AdminSelect value={video.video_type} onChange={(e) => {
                  const videos = [...form.videos];
                  videos[index] = { ...video, video_type: e.target.value as "youtube" | "mp4" };
                  patch({ videos });
                }}>
                  <option value="youtube">YouTube</option>
                  <option value="mp4">MP4</option>
                </AdminSelect>
              </AdminField>
              <AdminField label="影片網址" className="md:col-span-2">
                <AdminInput value={video.url} onChange={(e) => {
                  const videos = [...form.videos];
                  videos[index] = { ...video, url: e.target.value };
                  patch({ videos });
                }} placeholder="https://" />
              </AdminField>
              <AdminField label="封面圖網址">
                <AdminInput value={video.cover_url} onChange={(e) => {
                  const videos = [...form.videos];
                  videos[index] = { ...video, cover_url: e.target.value };
                  patch({ videos });
                }} />
              </AdminField>
              <div className="flex items-end justify-end">
                <Button type="button" size="sm" variant="outline" onClick={() => patch({ videos: form.videos.filter((v) => v.id !== video.id) })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="庫存" description="現貨、預購與庫存警示" icon={<Boxes className="h-5 w-5" />}>
        <div className="space-y-5">
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
            <AdminField label="現貨庫存">
              <AdminInput type="number" value={form.stock} onChange={(e) => patch({ stock: e.target.value })} />
            </AdminField>
            <AdminField label="安全庫存">
              <AdminInput type="number" value={form.safety_stock} onChange={(e) => patch({ safety_stock: e.target.value })} />
            </AdminField>
            <AdminField label="最低庫存警示">
              <AdminInput type="number" value={form.min_stock_alert} onChange={(e) => patch({ min_stock_alert: e.target.value })} />
            </AdminField>
          </div>
          {(form.inventory_mode === "preorder" || form.inventory_mode === "both") && (
            <div className="grid gap-4 md:grid-cols-3">
              <AdminField label="預購庫存">
                <AdminInput type="number" value={form.preorder_stock} onChange={(e) => patch({ preorder_stock: e.target.value })} />
              </AdminField>
              <AdminField label="預計到貨日期">
                <AdminInput type="date" value={form.expected_arrival_date} onChange={(e) => patch({ expected_arrival_date: e.target.value })} />
              </AdminField>
              <AdminField label="預購說明" className="md:col-span-3">
                <AdminTextarea value={form.preorder_note} onChange={(e) => patch({ preorder_note: e.target.value })} />
              </AdminField>
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <AdminCheckbox label="售出自動扣庫存" checked={form.auto_deduct_stock} onChange={(v) => patch({ auto_deduct_stock: v })} />
            <AdminCheckbox label="允許超賣" checked={form.allow_oversell} onChange={(v) => patch({ allow_oversell: v })} />
          </div>
        </div>
      </AdminCard>

      <AdminCard title="配送資訊" description="溫層、配送方式與尺寸" icon={<Truck className="h-5 w-5" />}>
        <div className="space-y-4">
          <AdminField label="配送溫層">
            <div className="grid gap-2 sm:grid-cols-3">
              <AdminCheckbox label="常溫" checked={form.temp_ambient} onChange={(v) => patch({ temp_ambient: v })} />
              <AdminCheckbox label="冷藏" checked={form.temp_chilled} onChange={(v) => patch({ temp_chilled: v })} />
              <AdminCheckbox label="冷凍" checked={form.temp_frozen} onChange={(v) => patch({ temp_frozen: v })} />
            </div>
          </AdminField>
          <div className="grid gap-2 sm:grid-cols-3">
            <AdminCheckbox label="可宅配" checked={form.ship_home} onChange={(v) => patch({ ship_home: v })} />
            <AdminCheckbox label="可超商" checked={form.ship_cvs} onChange={(v) => patch({ ship_cvs: v })} />
            <AdminCheckbox label="可門市取貨" checked={form.ship_store_pickup} onChange={(v) => patch({ ship_store_pickup: v })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <AdminField label="重量 (g)">
              <AdminInput type="number" value={form.weight_grams} onChange={(e) => patch({ weight_grams: e.target.value })} />
            </AdminField>
            <AdminField label="尺寸">
              <AdminInput value={form.dimensions} onChange={(e) => patch({ dimensions: e.target.value })} placeholder="長x寬x高 cm" />
            </AdminField>
          </div>
          {stores.length > 0 && (
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
          )}
        </div>
      </AdminCard>

      <AdminCard title="商品介紹" description="Rich Text 編輯器" icon={<FileText className="h-5 w-5" />} defaultOpen={false}>
        <AdminRichTextEditor
          value={form.rich_description}
          onChange={(rich_description) => patch({ rich_description })}
          placeholder="輸入商品詳細介紹…"
        />
        <div className="mt-4">
          <AdminField label="產品資訊 / 注意事項">
            <AdminTextarea value={form.product_info} onChange={(e) => patch({ product_info: e.target.value })} />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard title="SEO" description="搜尋引擎優化" icon={<Search className="h-5 w-5" />} defaultOpen={false}>
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="SEO Title" className="md:col-span-2">
            <AdminInput value={form.seo_title} onChange={(e) => patch({ seo_title: e.target.value })} />
          </AdminField>
          <AdminField label="SEO Description" className="md:col-span-2">
            <AdminTextarea value={form.seo_description} onChange={(e) => patch({ seo_description: e.target.value })} />
          </AdminField>
          <AdminField label="SEO Keywords">
            <AdminInput value={form.seo_keywords} onChange={(e) => patch({ seo_keywords: e.target.value })} />
          </AdminField>
          <AdminField label="URL Slug">
            <AdminInput value={form.slug} onChange={(e) => patch({ slug: e.target.value })} placeholder="product-name" />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard title="商品標籤" description="自由新增行銷標籤" icon={<Tag className="h-5 w-5" />} defaultOpen={false}>
        <TagInput tags={form.tags} onChange={(tags) => patch({ tags })} />
      </AdminCard>

      <AdminCard title="價格" description="原價、售價與毛利率" icon={<DollarSign className="h-5 w-5" />}>
        <div className="grid gap-4 md:grid-cols-3">
          <AdminField label="原價">
            <AdminInput type="number" value={form.original_price} onChange={(e) => patch({ original_price: e.target.value })} />
          </AdminField>
          <AdminField label="售價" required>
            <AdminInput type="number" value={form.price} onChange={(e) => patch({ price: e.target.value })} />
          </AdminField>
          <AdminField label="直播價">
            <AdminInput type="number" value={form.live_price} onChange={(e) => patch({ live_price: e.target.value })} />
          </AdminField>
          <AdminField label="VIP 價">
            <AdminInput type="number" value={form.vip_price} onChange={(e) => patch({ vip_price: e.target.value })} />
          </AdminField>
          <AdminField label="成本">
            <AdminInput type="number" value={form.cost_price} onChange={(e) => patch({ cost_price: e.target.value })} />
          </AdminField>
          <div className="flex flex-col justify-end rounded-2xl bg-[#F7F8FC] p-4">
            <p className="text-xs text-[#64748B]">毛利率（自動計算）</p>
            <p className="text-xl font-black text-[#1E3A8A]">
              {marginRate != null ? `${marginRate}%` : "—"}
            </p>
            {marginAmount != null && (
              <p className="text-sm text-[#64748B]">毛利 {formatCurrency(marginAmount)}</p>
            )}
          </div>
        </div>
      </AdminCard>

      <AdminCard title="商品規格" description="容量、尺寸、顏色、口味等" icon={<Settings2 className="h-5 w-5" />} defaultOpen={false}>
        <div className="space-y-3">
          {form.variants.map((variant, index) => (
            <div key={variant.id} className="grid gap-3 rounded-2xl border border-[#EEF1F8] p-4 md:grid-cols-4">
              <AdminField label="規格名稱">
                <AdminInput value={variant.name} onChange={(e) => {
                  const variants = [...form.variants];
                  variants[index] = { ...variant, name: e.target.value };
                  patch({ variants });
                }} placeholder="容量" />
              </AdminField>
              <AdminField label="規格值">
                <AdminInput value={variant.value} onChange={(e) => {
                  const variants = [...form.variants];
                  variants[index] = { ...variant, value: e.target.value };
                  patch({ variants });
                }} placeholder="500g" />
              </AdminField>
              <AdminField label="加價">
                <AdminInput type="number" value={variant.price_adjustment} onChange={(e) => {
                  const variants = [...form.variants];
                  variants[index] = { ...variant, price_adjustment: e.target.value };
                  patch({ variants });
                }} />
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
        </div>
      </AdminCard>

      <AdminCard title="批次管理" description="批號、效期與到貨日期" icon={<BarChart3 className="h-5 w-5" />} defaultOpen={false}>
        <div className="space-y-3">
          {form.batches.map((batch, index) => (
            <div key={batch.id} className="grid gap-3 rounded-2xl border border-[#EEF1F8] p-4 md:grid-cols-3">
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
              <AdminField label="到貨日期">
                <AdminInput type="date" value={batch.arrival_date} onChange={(e) => {
                  const batches = [...form.batches];
                  batches[index] = { ...batch, arrival_date: e.target.value };
                  patch({ batches });
                }} />
              </AdminField>
              <AdminField label="數量">
                <AdminInput type="number" value={batch.quantity} onChange={(e) => {
                  const batches = [...form.batches];
                  batches[index] = { ...batch, quantity: e.target.value };
                  patch({ batches });
                }} />
              </AdminField>
              <AdminField label="供應商">
                <AdminSelect value={batch.supplier_id} onChange={(e) => {
                  const batches = [...form.batches];
                  batches[index] = { ...batch, supplier_id: e.target.value };
                  patch({ batches });
                }}>
                  <option value="">選擇供應商</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </AdminSelect>
              </AdminField>
              <div className="flex items-end">
                <Button type="button" size="sm" variant="outline" onClick={() => patch({ batches: form.batches.filter((b) => b.id !== batch.id) })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => patch({ batches: [...form.batches, createEmptyBatch()] })}>
            <Plus className="mr-1 h-4 w-4" />新增批次
          </Button>
        </div>
      </AdminCard>
    </div>
  );
}
