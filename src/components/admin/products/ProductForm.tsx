"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductAdvancedSettings } from "@/components/admin/products/ProductAdvancedSettings";
import { ProductBasicInfo } from "@/components/admin/products/ProductBasicInfo";
import { ProductDescription } from "@/components/admin/products/ProductDescription";
import { DuplicateProductModal, type DuplicateOptions } from "@/components/admin/products/DuplicateProductModal";
import { ProductFormHeader } from "@/components/admin/products/ProductFormHeader";
import { ProductQuickSettings } from "@/components/admin/products/ProductQuickSettings";
import { ProductImageManager } from "@/components/admin/v2/ProductImageManager";
import { Button } from "@/components/ui/button";
import {
  emptyProductFormV2,
  formV2ToPayload,
  generateDatedProductSku,
  productToFormV2,
  validateProductFormDraftFields,
  validateProductFormPublishFields,
  type AdminProductFormV2,
  type ProductFormFieldErrors,
} from "@/lib/admin/product-form-v2";
import { mergeMainGalleryToImages } from "@/lib/products/product-images";
import type { GroupBuyCategory, ProductCategory, Store } from "@/lib/types/database";

type Brand = { id: string; name: string };
type Supplier = { id: string; name: string };

type Props = {
  mode: "create" | "edit";
  productId?: string;
  groupBuy?: boolean;
};

function snapshot(form: AdminProductFormV2) {
  return JSON.stringify(form);
}

export function ProductForm({ mode, productId, groupBuy = false }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<AdminProductFormV2>(() => {
    const base = emptyProductFormV2();
    return groupBuy ? { ...base, is_group_buy: true } : base;
  });
  const baseline = useRef(snapshot(form));
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [groupBuyCategories, setGroupBuyCategories] = useState<GroupBuyCategory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProductFormFieldErrors>({});
  const [layoutMode, setLayoutMode] = useState<"quick" | "full">("quick");
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [autoSaveLabel, setAutoSaveLabel] = useState<string | undefined>();
  const [meta, setMeta] = useState<{ created_at?: string; updated_at?: string }>({});
  const [notFound, setNotFound] = useState(false);

  const dirty = snapshot(form) !== baseline.current;
  const patch = useCallback((partial: Partial<AdminProductFormV2>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories?catalog=baking-materials").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
      fetch("/api/admin/suppliers").then((r) => r.json()),
      fetch("/api/admin/group-buy-categories").then((r) => r.json()),
      mode === "edit" ? fetch("/api/admin/products").then((r) => r.json()) : Promise.resolve(null),
    ])
      .then(([bakingRes, allCatRes, storeRes, brandRes, supplierRes, gbCatRes, productRes]) => {
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
        setGroupBuyCategories(gbCatRes.categories ?? []);
        if (mode === "edit" && productId) {
          const product = (productRes?.products ?? []).find((p: { id: string }) => p.id === productId);
          if (!product) {
            setNotFound(true);
            return;
          }
          const next = productToFormV2(product);
          setForm(next);
          baseline.current = snapshot(next);
          setMeta({ created_at: product.created_at, updated_at: product.updated_at });
        } else {
          baseline.current = snapshot(form);
        }
      })
      .catch(() => setToast("商品資料載入失敗"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, productId]);

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "商品資料尚未儲存，確定要離開嗎？";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  useEffect(() => {
    if (mode !== "edit" || form.status !== "draft" || !dirty || !productId) return;
    const t = setInterval(async () => {
      if (snapshot(form) === baseline.current) return;
      setAutoSaveLabel("正在儲存...");
      try {
        await persist(form, "draft");
        const now = new Date();
        setAutoSaveLabel(`已自動儲存 ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
      } catch {
        setAutoSaveLabel(undefined);
      }
    }, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, dirty, form.status, mode, productId]);

  const persist = async (
    next: AdminProductFormV2,
    status: AdminProductFormV2["status"],
    options?: { forceCreate?: boolean }
  ) => {
    const payload = formV2ToPayload({ ...next, status, is_group_buy: groupBuy ? true : next.is_group_buy });
    if (options?.forceCreate || mode === "create") {
      const body = groupBuy
        ? { ...payload, is_group_buy: true, publish_group_buy: status === "active", channels: ["group_buy", "website"] }
        : payload;
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      return data.product.id as string;
    }
    const res = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "儲存失敗");
    return productId as string;
  };

  const saveManual = async () => {
    const keepPublished = form.status === "active";
    const next = keepPublished ? form : { ...form, status: "draft" as const };
    const fieldErrors = keepPublished
      ? validateProductFormPublishFields(next)
      : validateProductFormDraftFields(next);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const id = await persist(next, next.status);
      setForm(next);
      baseline.current = snapshot(next);
      setToast("商品已儲存");
      if (mode === "create") router.push(`/admin/products/${id}/edit`);
    } catch (e) {
      setToast(`商品儲存失敗${e instanceof Error ? `：${e.message}` : ""}`);
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    const next = { ...form, status: "active" as const };
    const fieldErrors = validateProductFormPublishFields(next);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const id = await persist(next, "active");
      setForm(next);
      baseline.current = snapshot(next);
      setToast(mode === "edit" && form.status === "active" ? "商品已儲存" : "商品已成功上架");
      if (mode === "create") router.push(`/admin/products/${id}/edit`);
    } catch (e) {
      setToast(`商品儲存失敗${e instanceof Error ? `：${e.message}` : ""}`);
    } finally {
      setSaving(false);
    }
  };

  const preview = () => {
    if (mode === "edit" && productId) {
      window.open(`/shop/products/${productId}`, "_blank");
      return;
    }
    setToast("請先儲存商品後再預覽");
  };

  const clone = async (opts: DuplicateOptions) => {
    const src = emptyProductFormV2();
    const next: AdminProductFormV2 = {
      ...src,
      status: "draft",
      sku: opts.sku && form.sku ? `${form.sku}-COPY` : generateDatedProductSku(),
      name: opts.name ? `${form.name}（副本）` : "",
      subtitle: opts.content ? form.subtitle : "",
      price: opts.price ? form.price : "",
      original_price: opts.price ? form.original_price : "",
      live_price: opts.price ? form.live_price : "",
      vip_price: opts.price ? form.vip_price : "",
      cost_price: opts.price ? form.cost_price : "",
      category_ids: opts.categories ? form.category_ids : [],
      ship_home: opts.shipping ? form.ship_home : src.ship_home,
      ship_cvs: opts.shipping ? form.ship_cvs : src.ship_cvs,
      ship_store_pickup: opts.shipping ? form.ship_store_pickup : src.ship_store_pickup,
      temp_ambient: opts.shipping ? form.temp_ambient : src.temp_ambient,
      temp_chilled: opts.shipping ? form.temp_chilled : src.temp_chilled,
      temp_frozen: opts.shipping ? form.temp_frozen : src.temp_frozen,
      rich_description: opts.content ? form.rich_description : "",
      product_info: opts.content ? form.product_info : "",
      specifications: opts.content ? form.specifications : "",
      seo_title: opts.seo ? form.seo_title : "",
      seo_description: opts.seo ? form.seo_description : "",
      seo_keywords: opts.seo ? form.seo_keywords : "",
      slug: "",
      variants: opts.variants ? form.variants.map((v) => ({ ...v, id: `${v.id}-copy` })) : [],
      mainImage: opts.images ? form.mainImage : null,
      galleryImages: opts.images ? form.galleryImages : [],
      contentImages: opts.images ? form.contentImages : [],
      images: opts.images ? form.images : [],
      stock: opts.stock ? form.stock : src.stock,
    };
    setDuplicateOpen(false);
    setSaving(true);
    try {
      const id = await persist(next, "draft", { forceCreate: true });
      router.push(`/admin/products/${id}/edit`);
    } catch (e) {
      setToast(`商品儲存失敗${e instanceof Error ? `：${e.message}` : ""}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-white" />
        <div className="h-64 animate-pulse rounded-xl bg-white" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p>找不到此商品</p>
        <Link href="/admin/products">
          <Button variant="outline">返回商品列表</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-4 min-h-full bg-[#F7F8FA] px-4 py-6 md:-mx-6 md:px-6">
      <div className="mx-auto max-w-[1600px]">
        <ProductFormHeader
          mode={mode}
          isPublished={form.status === "active"}
          dirty={dirty}
          saving={saving}
          autoSaveLabel={autoSaveLabel}
          onSaveDraft={() => void saveManual()}
          onPublish={() => void publish()}
          onPreview={preview}
          onDuplicate={mode === "edit" ? () => setDuplicateOpen(true) : undefined}
        />

        {mode === "create" ? (
          <div className="mb-4 inline-flex rounded-xl border border-gray-200 bg-white p-1 text-sm">
            <button
              type="button"
              className={`rounded-lg px-3 py-1.5 ${layoutMode === "quick" ? "bg-[#153E73] text-white" : ""}`}
              onClick={() => setLayoutMode("quick")}
            >
              快速新增
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-1.5 ${layoutMode === "full" ? "bg-[#153E73] text-white" : ""}`}
              onClick={() => setLayoutMode("full")}
            >
              完整設定
            </button>
          </div>
        ) : null}

        {toast ? <p className="mb-3 rounded-xl bg-white px-4 py-2 text-sm text-[#153E73] shadow-sm">{toast}</p> : null}
        {errors.form || errors.image ? (
          <p className="mb-3 text-sm text-[#F16458]">{errors.form || errors.image}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <ProductBasicInfo form={form} patch={patch} errors={errors} />
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-[#153E73]">② 商品圖片</h2>
              <ProductImageManager
                productId={productId}
                main={form.mainImage}
                gallery={form.galleryImages}
                content={form.contentImages}
                onMainChange={(mainImage) =>
                  patch({ mainImage, images: mergeMainGalleryToImages(mainImage, form.galleryImages) })
                }
                onGalleryChange={(galleryImages) =>
                  patch({ galleryImages, images: mergeMainGalleryToImages(form.mainImage, galleryImages) })
                }
                onContentChange={(contentImages) => patch({ contentImages })}
              />
            </section>
            <ProductDescription form={form} patch={patch} />
            {mode === "edit" || layoutMode === "full" ? (
              <ProductAdvancedSettings
                form={form}
                patch={patch}
                stores={stores}
                brands={brands}
                suppliers={suppliers}
                groupBuyCategories={groupBuyCategories}
                lockGroupBuy={groupBuy}
                productId={productId}
                createdAt={meta.created_at}
                updatedAt={meta.updated_at}
              />
            ) : null}
          </div>
          <ProductQuickSettings form={form} patch={patch} categories={categories} errors={errors} />
        </div>
      </div>
      <DuplicateProductModal open={duplicateOpen} onClose={() => setDuplicateOpen(false)} onConfirm={(opts) => void clone(opts)} />
    </div>
  );
}
