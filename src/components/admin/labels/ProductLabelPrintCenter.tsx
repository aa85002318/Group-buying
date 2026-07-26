"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Minus, Plus, Printer, Search, Tag } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { LabelPreviewCard, LabelPrintSheet } from "@/components/admin/labels/LabelPreview";
import {
  BUILTIN_TEMPLATES,
  FIELD_TOGGLES,
  PRICE_LABEL_TEMPLATES,
  SIZE_PRESETS,
  expandQueueForPrint,
  formatPriceTwd,
  formatSpecOrWeight,
  getAppPrice,
  getListPrice,
  getSalePrice,
  isPriceLabelTemplateCode,
  mergeTemplatesWithBuiltins,
  productMissingForTemplate,
  resolveLabelPrice,
  toPriceLabelPrintItems,
  type LabelPaperMode,
  type LabelPriceSource,
  type LabelProduct,
  type LabelTemplateConfig,
  type PrintQueueItem,
} from "@/lib/admin/product-labels";
import { cn } from "@/lib/utils";

type Brand = { id: string; name: string };
type Category = { id: string; name: string };
type QuickFilter =
  | "all"
  | "selected"
  | "has_app"
  | "has_sale"
  | "missing_barcode"
  | "missing_price";

type SelectedEntry = { product: LabelProduct; copies: number };

type Props = {
  initialProductIds?: string[];
};

export function ProductLabelPrintCenter({ initialProductIds = [] }: Props) {
  const [search, setSearch] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [products, setProducts] = useState<LabelProduct[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, SelectedEntry>>({});
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<LabelTemplateConfig[]>(BUILTIN_TEMPLATES);
  const [template, setTemplate] = useState<LabelTemplateConfig>(PRICE_LABEL_TEMPLATES[0]);
  const [defaultPriceSource, setDefaultPriceSource] = useState<LabelPriceSource>("app");
  const [paperMode, setPaperMode] = useState<LabelPaperMode>("label");
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const selectedList = useMemo(() => Object.values(selectedMap), [selectedMap]);
  const selectedCount = selectedList.length;
  const totalCopies = useMemo(
    () => selectedList.reduce((s, e) => s + Math.max(1, e.copies), 0),
    [selectedList]
  );

  const queue: PrintQueueItem[] = useMemo(
    () =>
      selectedList.map((e) => ({
        product: e.product,
        copies: e.copies,
        priceSource: defaultPriceSource,
        customPrice: null,
        promoText: null,
      })),
    [selectedList, defaultPriceSource]
  );

  const missingSelected = useMemo(
    () =>
      selectedList.filter((e) => productMissingForTemplate(e.product, template.code)),
    [selectedList, template.code]
  );

  const printableQueue = useMemo(
    () =>
      queue.filter((q) => !productMissingForTemplate(q.product, template.code)),
    [queue, template.code]
  );

  const printLabels = expandQueueForPrint(printableQueue);

  const previewItems = printableQueue.length ? printableQueue : queue;
  const safePreviewIndex = Math.min(
    previewIndex,
    Math.max(0, previewItems.length - 1)
  );
  const previewItem = previewItems[safePreviewIndex] ?? null;

  const loadFilters = useCallback(() => {
    Promise.all([
      fetch("/api/admin/brands").then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/categories").then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/products/labels?mode=templates").then((r) => r.json()).catch(() => ({})),
    ]).then(([brandRes, catRes, tplRes]) => {
      setBrands(brandRes.brands ?? []);
      setCategories(catRes.categories ?? []);
      const merged = mergeTemplatesWithBuiltins(tplRes.templates);
      setTemplates(merged);
      const def =
        merged.find((t) => t.code === "simple") ??
        merged.find((t) => t.is_default) ??
        merged[0];
      setTemplate(def);
    });
  }, []);

  const searchProducts = useCallback(
    async (opts?: { ids?: string[] }) => {
      setLoading(true);
      setMessage(null);
      try {
        const params = new URLSearchParams();
        if (opts?.ids?.length) {
          params.set("ids", opts.ids.join(","));
        } else {
          if (search.trim()) params.set("search", search.trim());
          if (brandId) params.set("brand_id", brandId);
          if (categoryId) params.set("category_id", categoryId);
          if (activeOnly) params.set("active", "1");
        }
        params.set("limit", "100");
        const res = await fetch(`/api/admin/products/labels?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "搜尋失敗");
        const list = (data.products ?? []) as LabelProduct[];
        setProducts(list);
        // Refresh product snapshots in selection without clearing copies
        setSelectedMap((prev) => {
          const next = { ...prev };
          for (const p of list) {
            if (next[p.id]) next[p.id] = { ...next[p.id], product: p };
          }
          return next;
        });
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "搜尋失敗");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [search, brandId, categoryId, activeOnly]
  );

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    if (initialProductIds.length) {
      void searchProducts({ ids: initialProductIds });
    } else {
      void searchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once
  }, []);

  useEffect(() => {
    if (!initialProductIds.length || !products.length) return;
    setSelectedMap((prev) => {
      if (Object.keys(prev).length) return prev;
      const next: Record<string, SelectedEntry> = {};
      for (const p of products) {
        if (initialProductIds.includes(p.id)) {
          next[p.id] = { product: p, copies: 1 };
        }
      }
      return next;
    });
  }, [products, initialProductIds]);

  useEffect(() => {
    setPreviewIndex(0);
  }, [template.code, selectedCount]);

  useEffect(() => {
    if (!isPriceLabelTemplateCode(template.code)) return;
    if (!missingSelected.length) {
      setMessage(null);
      return;
    }
    const label =
      template.code === "app_month"
        ? "App 優惠價"
        : template.code === "sale"
          ? "特價"
          : "一般售價";
    setMessage(
      `有 ${missingSelected.length} 項商品尚未設定${label}，將不納入列印。`
    );
  }, [template.code, missingSelected.length]);

  const displayedProducts = useMemo(() => {
    let list = products;
    switch (quickFilter) {
      case "selected":
        list = list.filter((p) => Boolean(selectedMap[p.id]));
        break;
      case "has_app":
        list = list.filter((p) => getAppPrice(p) != null);
        break;
      case "has_sale":
        list = list.filter((p) => getSalePrice(p) != null);
        break;
      case "missing_barcode":
        list = list.filter((p) => !p.barcode);
        break;
      case "missing_price":
        list = list.filter((p) => !(getListPrice(p) > 0));
        break;
      default:
        break;
    }
    if (showMissingOnly) {
      list = list.filter((p) => productMissingForTemplate(p, template.code));
    }
    return list;
  }, [products, quickFilter, selectedMap, showMissingOnly, template.code]);

  const pageSelectedCount = displayedProducts.filter((p) => selectedMap[p.id]).length;
  const allPageSelected =
    displayedProducts.length > 0 && pageSelectedCount === displayedProducts.length;

  const toggleSelect = (product: LabelProduct) => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[product.id]) delete next[product.id];
      else next[product.id] = { product, copies: 1 };
      return next;
    });
  };

  const selectAllPage = () => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      for (const p of displayedProducts) {
        if (!next[p.id]) next[p.id] = { product: p, copies: 1 };
      }
      return next;
    });
  };

  const selectAllResults = () => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      for (const p of products) {
        if (!next[p.id]) next[p.id] = { product: p, copies: 1 };
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedMap({});

  const setCopies = (productId: string, copies: number) => {
    setSelectedMap((prev) => {
      const entry = prev[productId];
      if (!entry) return prev;
      return {
        ...prev,
        [productId]: {
          ...entry,
          copies: Math.max(1, Math.min(99, Math.floor(copies) || 1)),
        },
      };
    });
  };

  const applyTemplate = (tpl: LabelTemplateConfig) => {
    const next = { ...tpl };
    if (next.monochrome || isPriceLabelTemplateCode(next.code)) {
      next.width_mm = 70;
      next.height_mm = 30;
      next.show_logo = false;
      next.show_origin = false;
      next.monochrome = true;
    }
    setTemplate(next);
    setShowMissingOnly(false);
  };

  const patchTemplate = <K extends keyof LabelTemplateConfig>(
    key: K,
    value: LabelTemplateConfig[K]
  ) => {
    if (template.monochrome || isPriceLabelTemplateCode(template.code)) {
      if (key === "show_logo" || key === "show_origin") return;
    }
    setTemplate((prev) => ({ ...prev, [key]: value }));
  };

  const handlePrint = async () => {
    if (!printableQueue.length) {
      setMessage(
        missingSelected.length
          ? `已選 ${selectedCount} 項，但沒有可列印商品（缺少必要價格）。`
          : "請先勾選商品"
      );
      return;
    }
    setPrinting(true);
    try {
      const templateCode = isPriceLabelTemplateCode(template.code)
        ? template.code
        : undefined;
      const printItems = templateCode
        ? toPriceLabelPrintItems(printableQueue, templateCode)
        : undefined;

      await fetch("/api/admin/products/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: template.id ?? null,
          templateCode,
          print_mode: "browser",
          paper_mode: paperMode,
          width_mm: template.width_mm,
          height_mm: template.height_mm,
          widthMm: template.width_mm,
          heightMm: template.height_mm,
          settings: {
            style_variant: template.style_variant,
            barcode_type: template.barcode_type,
            monochrome: Boolean(template.monochrome),
            templateCode,
          },
          items: printableQueue.map((q) => {
            const resolved = resolveLabelPrice(q.product, q.priceSource, q.customPrice);
            return {
              product_id: q.product.id,
              productId: q.product.id,
              copies: q.copies,
              price_used: resolved.price,
              compare_price: resolved.comparePrice,
              price_source: q.priceSource,
            };
          }),
          printRequest: templateCode
            ? {
                templateCode,
                widthMm: template.width_mm,
                heightMm: template.height_mm,
                items: printItems,
              }
            : undefined,
        }),
      });
    } catch {
      // still allow print
    }

    requestAnimationFrame(() => {
      window.print();
      setPrinting(false);
      setMessage(`已送出列印（共 ${printLabels.length} 張）`);
    });
  };

  const isMono = Boolean(template.monochrome || isPriceLabelTemplateCode(template.code));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="價格牌列印中心"
        description="勾選商品 → 選黑白公版或自訂版型 → 預覽 → 瀏覽器列印"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/products">
              <Button variant="outline">商品主檔</Button>
            </Link>
            <Button
              onClick={handlePrint}
              disabled={!printableQueue.length || printing}
              className="bg-primary hover:bg-[#E63D6A]"
            >
              <Printer className="mr-1.5 h-4 w-4" />
              {printing ? "準備中…" : `列印（${printLabels.length}）`}
            </Button>
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm">
        已選擇 <strong>{selectedCount}</strong> 項商品，共列印{" "}
        <strong>{totalCopies}</strong> 張價格牌
        {missingSelected.length > 0 && isMono && (
          <span className="ml-2 text-amber-700">
            （其中 {missingSelected.length} 項因缺資料不列印）
          </span>
        )}
      </div>

      {message && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>{message}</span>
          {missingSelected.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowMissingOnly(true);
                setQuickFilter("all");
              }}
            >
              查看缺少資料的商品
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Tag className="h-4 w-4 text-primary" />
              版型選擇
            </h2>
            <div className="mb-2 text-xs font-semibold text-foreground-secondary">
              黑白熱感公版（70×30 mm）
            </div>
            <div className="mb-4 flex flex-wrap gap-3">
              {PRICE_LABEL_TEMPLATES.map((tpl) => (
                <label
                  key={tpl.code}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                    template.code === tpl.code
                      ? "border-foreground bg-background font-semibold"
                      : "border-border"
                  )}
                >
                  <input
                    type="radio"
                    name="monoTemplate"
                    checked={template.code === tpl.code}
                    onChange={() => applyTemplate(tpl)}
                  />
                  {tpl.name}
                </label>
              ))}
            </div>
            <div className="mb-2 text-xs font-semibold text-foreground-secondary">其他版型</div>
            <div className="flex flex-wrap gap-2">
              {templates
                .filter((t) => !isPriceLabelTemplateCode(t.code))
                .map((tpl) => (
                  <button
                    key={tpl.code ?? tpl.name}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      template.code === tpl.code
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background hover:border-primary"
                    )}
                  >
                    {tpl.name}
                  </button>
                ))}
            </div>
          </section>

          <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-foreground">商品勾選</h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                  placeholder="名稱／簡稱／條碼／SKU"
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="">全部品牌</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="">全部分類</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <label className="flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                />
                僅上架
              </label>
              <Button variant="secondary" onClick={() => searchProducts()} disabled={loading}>
                {loading ? "搜尋中…" : "搜尋"}
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["all", "全部商品"],
                  ["selected", "已勾選"],
                  ["has_app", "有 App 優惠價"],
                  ["has_sale", "有特價"],
                  ["missing_barcode", "缺少條碼"],
                  ["missing_price", "缺少售價"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setQuickFilter(value);
                    setShowMissingOnly(false);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    quickFilter === value && !showMissingOnly
                      ? "border-foreground bg-foreground text-white"
                      : "border-border"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={selectAllPage}>
                全選目前頁面
              </Button>
              <Button size="sm" variant="outline" onClick={selectAllResults}>
                全選搜尋結果
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                取消全選
              </Button>
            </div>

            <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-border">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="sticky top-0 bg-background text-xs text-foreground-secondary">
                  <tr>
                    <th className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={() => {
                          if (allPageSelected) {
                            setSelectedMap((prev) => {
                              const next = { ...prev };
                              for (const p of displayedProducts) delete next[p.id];
                              return next;
                            });
                          } else selectAllPage();
                        }}
                        aria-label="全選目前頁面"
                      />
                    </th>
                    <th className="px-3 py-2">商品名稱</th>
                    <th className="px-3 py-2">規格／克數</th>
                    <th className="px-3 py-2">條碼</th>
                    <th className="px-3 py-2 text-right">一般售價</th>
                    <th className="px-3 py-2 text-right">App 優惠價</th>
                    <th className="px-3 py-2 text-right">特價</th>
                    <th className="px-3 py-2">列印份數</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.map((p) => {
                    const selected = Boolean(selectedMap[p.id]);
                    const copies = selectedMap[p.id]?.copies ?? 1;
                    const missing = productMissingForTemplate(p, template.code);
                    const app = getAppPrice(p);
                    const sale = getSalePrice(p);
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "border-t border-border hover:bg-background/80",
                          selected && "bg-primary-soft/30",
                          missing && selected && "bg-amber-50"
                        )}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(p)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{p.name}</div>
                          {missing && (
                            <p className="text-xs font-medium text-amber-700">{missing}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-foreground-secondary">
                          {formatSpecOrWeight(p) || "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-foreground-secondary">
                          {p.barcode || "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {getListPrice(p) > 0 ? formatPriceTwd(getListPrice(p)) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {app != null ? formatPriceTwd(app) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {sale != null ? formatPriceTwd(sale) : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={!selected}
                              className="flex h-7 w-7 items-center justify-center rounded border border-border disabled:opacity-40"
                              onClick={() => setCopies(p.id, copies - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm tabular-nums">{copies}</span>
                            <button
                              type="button"
                              disabled={!selected}
                              className="flex h-7 w-7 items-center justify-center rounded border border-border disabled:opacity-40"
                              onClick={() => setCopies(p.id, copies + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!displayedProducts.length && !loading && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-foreground-secondary">
                        沒有符合的商品
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!isMono && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground-secondary">
                經典版型價格來源：
                {(
                  [
                    ["app", "App售價"],
                    ["suggested", "建議售價"],
                    ["store", "門市售價"],
                    ["vip", "會員價"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="priceSource"
                      checked={defaultPriceSource === value}
                      onChange={() => setDefaultPriceSource(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </section>

          {!isMono && (
            <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
              <h2 className="mb-3 text-sm font-bold">自訂尺寸與欄位（經典版型）</h2>
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs">
                  寬（mm）
                  <input
                    type="number"
                    min={20}
                    max={210}
                    value={template.width_mm}
                    onChange={(e) => patchTemplate("width_mm", Number(e.target.value) || 70)}
                    className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
                  />
                </label>
                <label className="text-xs">
                  高（mm）
                  <input
                    type="number"
                    min={15}
                    max={297}
                    value={template.height_mm}
                    onChange={(e) => patchTemplate("height_mm", Number(e.target.value) || 30)}
                    className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
                  />
                </label>
                <div className="text-xs sm:col-span-2">
                  常用尺寸
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {SIZE_PRESETS.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() =>
                          setTemplate((prev) => ({
                            ...prev,
                            width_mm: s.width,
                            height_mm: s.height,
                          }))
                        }
                        className="rounded-lg border border-border px-2 py-1.5 text-xs hover:border-primary"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mb-4 flex flex-wrap gap-3">
                <label className="text-xs">
                  紙張
                  <select
                    value={paperMode}
                    onChange={(e) => setPaperMode(e.target.value as LabelPaperMode)}
                    className="ml-2 h-9 rounded-lg border border-border px-2 text-sm"
                  >
                    <option value="label">標籤紙／熱感機</option>
                    <option value="a4">A4 拼版</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {FIELD_TOGGLES.map((f) => (
                  <label key={f.key} className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(template[f.configKey])}
                      onChange={(e) => patchTemplate(f.configKey, e.target.checked as never)}
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="no-print xl:sticky xl:top-4 xl:self-start">
          <div className="rounded-[20px] border border-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold">即時預覽</h2>
            {previewItem ? (
              <>
                <LabelPreviewCard
                  item={previewItem}
                  template={template}
                  className="mx-auto w-full max-w-[280px]"
                />
                {previewItems.length > 1 && (
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={safePreviewIndex <= 0}
                      onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      上一個
                    </Button>
                    <span>
                      預覽第 {safePreviewIndex + 1}／{previewItems.length} 項
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={safePreviewIndex >= previewItems.length - 1}
                      onClick={() =>
                        setPreviewIndex((i) => Math.min(previewItems.length - 1, i + 1))
                      }
                    >
                      下一個
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <div className="mt-3 space-y-1 text-xs text-foreground-secondary">
                  <p>
                    目前預覽：{previewItem.product.name}
                    {formatSpecOrWeight(previewItem.product)
                      ? ` ${formatSpecOrWeight(previewItem.product)}`
                      : ""}
                  </p>
                  <p>模板：{template.name}</p>
                  <p>列印份數：{previewItem.copies}</p>
                </div>
              </>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-foreground-secondary">
                勾選商品後顯示預覽
              </div>
            )}
            <p className="mt-3 text-center text-xs text-foreground-secondary">
              {template.width_mm}×{template.height_mm} mm · {template.name}
            </p>
            <Button
              className="mt-4 w-full bg-primary hover:bg-[#E63D6A]"
              onClick={handlePrint}
              disabled={!printableQueue.length || printing}
            >
              <Printer className="mr-1.5 h-4 w-4" />
              立即列印
            </Button>
          </div>
        </aside>
      </div>

      <LabelPrintSheet items={printLabels} template={template} paperMode={paperMode} />
    </div>
  );
}
