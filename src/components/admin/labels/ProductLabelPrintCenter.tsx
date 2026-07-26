"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Printer,
  Search,
  Trash2,
  Plus,
  Tag,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { LabelPreviewCard, LabelPrintSheet } from "@/components/admin/labels/LabelPreview";
import {
  BUILTIN_TEMPLATES,
  FIELD_TOGGLES,
  SIZE_PRESETS,
  expandQueueForPrint,
  formatPriceTwd,
  resolveLabelPrice,
  type LabelPaperMode,
  type LabelPriceSource,
  type LabelProduct,
  type LabelTemplateConfig,
  type PrintQueueItem,
} from "@/lib/admin/product-labels";
import { cn } from "@/lib/utils";

type Brand = { id: string; name: string };
type Category = { id: string; name: string };

type Props = {
  initialProductIds?: string[];
};

export function ProductLabelPrintCenter({ initialProductIds = [] }: Props) {
  const [search, setSearch] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [recentOnly, setRecentOnly] = useState(false);
  const [products, setProducts] = useState<LabelProduct[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<PrintQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<LabelTemplateConfig[]>(BUILTIN_TEMPLATES);
  const [template, setTemplate] = useState<LabelTemplateConfig>(BUILTIN_TEMPLATES[0]);
  const [defaultPriceSource, setDefaultPriceSource] = useState<LabelPriceSource>("app");
  const [paperMode, setPaperMode] = useState<LabelPaperMode>("label");
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const previewItem = queue[0] ?? null;

  const loadFilters = useCallback(() => {
    Promise.all([
      fetch("/api/admin/brands").then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/categories").then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/products/labels?mode=templates").then((r) => r.json()).catch(() => ({})),
    ]).then(([brandRes, catRes, tplRes]) => {
      setBrands(brandRes.brands ?? []);
      setCategories(catRes.categories ?? []);
      if (Array.isArray(tplRes.templates) && tplRes.templates.length) {
        setTemplates(tplRes.templates);
        const def =
          tplRes.templates.find((t: LabelTemplateConfig) => t.is_default) ??
          tplRes.templates[0];
        setTemplate(def);
      }
    });
  }, []);

  const searchProducts = useCallback(async (opts?: { ids?: string[] }) => {
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
        if (recentOnly) params.set("recent_days", "14");
      }
      params.set("limit", "60");
      const res = await fetch(`/api/admin/products/labels?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "搜尋失敗");
      setProducts(data.products ?? []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "搜尋失敗");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, brandId, categoryId, activeOnly, recentOnly]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    if (initialProductIds.length) {
      searchProducts({ ids: initialProductIds }).then(() => {
        // queue will be filled after products load — handled below
      });
    } else {
      searchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once
  }, []);

  useEffect(() => {
    if (!initialProductIds.length || !products.length) return;
    const seeded = products.filter((p) => initialProductIds.includes(p.id));
    if (!seeded.length) return;
    setQueue((prev) => {
      if (prev.length) return prev;
      return seeded.map((product) => ({
        product,
        copies: 1,
        priceSource: defaultPriceSource,
        customPrice: null,
        promoText: null,
      }));
    });
    setSelected(new Set(seeded.map((p) => p.id)));
  }, [products, initialProductIds, defaultPriceSource]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSelectedToQueue = () => {
    const toAdd = products.filter((p) => selected.has(p.id));
    if (!toAdd.length) {
      setMessage("請先勾選商品");
      return;
    }
    setQueue((prev) => {
      const map = new Map(prev.map((q) => [q.product.id, q]));
      for (const product of toAdd) {
        const existing = map.get(product.id);
        if (existing) {
          map.set(product.id, { ...existing, copies: existing.copies + 1 });
        } else {
          map.set(product.id, {
            product,
            copies: 1,
            priceSource: defaultPriceSource,
            customPrice: null,
            promoText: null,
          });
        }
      }
      return Array.from(map.values());
    });
    setMessage(`已加入 ${toAdd.length} 項至列印清單`);
  };

  const addAllRecent = async () => {
    setRecentOnly(true);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        recent_days: "14",
        active: "1",
        limit: "100",
      });
      const res = await fetch(`/api/admin/products/labels?${params}`);
      const data = await res.json();
      const list = (data.products ?? []) as LabelProduct[];
      setProducts(list);
      setQueue(
        list.map((product) => ({
          product,
          copies: 1,
          priceSource: defaultPriceSource,
          customPrice: null,
          promoText: null,
        }))
      );
      setSelected(new Set(list.map((p) => p.id)));
      setMessage(`已加入近 14 天新品 ${list.length} 項`);
    } catch {
      setMessage("載入新品失敗");
    } finally {
      setLoading(false);
    }
  };

  const updateQueueItem = (productId: string, patch: Partial<PrintQueueItem>) => {
    setQueue((prev) =>
      prev.map((q) => (q.product.id === productId ? { ...q, ...patch } : q))
    );
  };

  const removeFromQueue = (productId: string) => {
    setQueue((prev) => prev.filter((q) => q.product.id !== productId));
  };

  const applyTemplate = (tpl: LabelTemplateConfig) => {
    setTemplate({ ...tpl });
  };

  const patchTemplate = <K extends keyof LabelTemplateConfig>(
    key: K,
    value: LabelTemplateConfig[K]
  ) => {
    setTemplate((prev) => ({ ...prev, [key]: value }));
  };

  const printLabels = expandQueueForPrint(queue);
  const totalCopies = useMemo(
    () => queue.reduce((s, q) => s + Math.max(1, q.copies), 0),
    [queue]
  );

  const handlePrint = async () => {
    if (!queue.length) {
      setMessage("列印清單為空");
      return;
    }
    setPrinting(true);
    setMessage(null);
    try {
      await fetch("/api/admin/products/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: template.id ?? null,
          print_mode: "browser",
          paper_mode: paperMode,
          width_mm: template.width_mm,
          height_mm: template.height_mm,
          settings: {
            style_variant: template.style_variant,
            barcode_type: template.barcode_type,
            price_font_size: template.price_font_size,
            name_font_size: template.name_font_size,
          },
          items: queue.map((q) => {
            const resolved = resolveLabelPrice(q.product, q.priceSource, q.customPrice);
            return {
              product_id: q.product.id,
              copies: q.copies,
              price_used: resolved.price,
              compare_price: resolved.comparePrice,
              price_source: q.priceSource,
            };
          }),
        }),
      });
    } catch {
      // still allow print
    }

    // Let print sheet render, then open dialog
    requestAnimationFrame(() => {
      window.print();
      setPrinting(false);
      setMessage(`已送出列印（共 ${totalCopies} 張）`);
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="價格牌列印中心"
        description="搜尋商品 → 加入清單 → 選模板／尺寸 → 預覽 → 瀏覽器列印（A4／標籤紙／熱感機皆可）"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/products">
              <Button variant="outline">商品主檔</Button>
            </Link>
            <Button
              onClick={handlePrint}
              disabled={!queue.length || printing}
              className="bg-primary hover:bg-[#E63D6A]"
            >
              <Printer className="mr-1.5 h-4 w-4" />
              {printing ? "準備中…" : `列印（${totalCopies}）`}
            </Button>
          </div>
        }
      />

      {message && (
        <p className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
          {message}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Search */}
          <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-foreground">搜尋商品</h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                  placeholder="名稱／條碼／SKU"
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
              <label className="flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm">
                <input
                  type="checkbox"
                  checked={recentOnly}
                  onChange={(e) => setRecentOnly(e.target.checked)}
                />
                最近新增
              </label>
              <Button variant="secondary" onClick={() => searchProducts()} disabled={loading}>
                {loading ? "搜尋中…" : "搜尋"}
              </Button>
              <Button variant="outline" onClick={addAllRecent}>
                今天全部新品
              </Button>
            </div>

            <div className="mt-4 max-h-[280px] overflow-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-background text-xs text-foreground-secondary">
                  <tr>
                    <th className="px-3 py-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => {
                          if (selected.size === products.length) setSelected(new Set());
                          else setSelected(new Set(products.map((p) => p.id)));
                        }}
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-3 py-2">商品</th>
                    <th className="px-3 py-2">條碼</th>
                    <th className="px-3 py-2">售價</th>
                    <th className="px-3 py-2">品牌</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const price = resolveLabelPrice(p, defaultPriceSource, null).price;
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "border-t border-border hover:bg-background/80",
                          selected.has(p.id) && "bg-primary-soft/40"
                        )}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">{p.name}</td>
                        <td className="px-3 py-2 font-mono text-xs text-foreground-secondary">
                          {p.barcode || "—"}
                        </td>
                        <td className="px-3 py-2">{formatPriceTwd(price)}</td>
                        <td className="px-3 py-2 text-foreground-secondary">
                          {p.brand_name || "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {!products.length && !loading && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-foreground-secondary">
                        沒有符合的商品
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button onClick={addSelectedToQueue} variant="secondary">
                <Plus className="mr-1.5 h-4 w-4" />
                加入列印清單（{selected.size}）
              </Button>
              <span className="text-xs text-foreground-secondary">
                預設價格來源：
              </span>
              {(
                [
                  ["app", "App售價"],
                  ["suggested", "建議售價"],
                  ["store", "門市售價"],
                  ["vip", "會員價"],
                  ["custom", "自訂"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-1 text-xs">
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
          </section>

          {/* Queue */}
          <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">
                列印清單（{queue.length} 品項／{totalCopies} 張）
              </h2>
              {queue.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setQueue([])}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  清空
                </Button>
              )}
            </div>
            {!queue.length ? (
              <p className="py-6 text-center text-sm text-foreground-secondary">
                勾選商品後按「加入列印清單」
              </p>
            ) : (
              <div className="space-y-3">
                {queue.map((q) => {
                  const resolved = resolveLabelPrice(q.product, q.priceSource, q.customPrice);
                  return (
                    <div
                      key={q.product.id}
                      className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-3"
                    >
                      <div className="min-w-[160px] flex-1">
                        <p className="font-semibold text-foreground">{q.product.name}</p>
                        <p className="text-xs text-foreground-secondary">
                          {q.product.barcode || "無條碼"} · {resolved.label}{" "}
                          {formatPriceTwd(resolved.price)}
                        </p>
                      </div>
                      <label className="text-xs">
                        張數
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={q.copies}
                          onChange={(e) =>
                            updateQueueItem(q.product.id, {
                              copies: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="ml-1 h-9 w-16 rounded-lg border border-border px-2 text-sm"
                        />
                      </label>
                      <label className="text-xs">
                        價格來源
                        <select
                          value={q.priceSource}
                          onChange={(e) =>
                            updateQueueItem(q.product.id, {
                              priceSource: e.target.value as LabelPriceSource,
                            })
                          }
                          className="ml-1 h-9 rounded-lg border border-border px-2 text-sm"
                        >
                          <option value="app">App售價</option>
                          <option value="suggested">建議售價</option>
                          <option value="store">門市售價</option>
                          <option value="vip">會員價</option>
                          <option value="custom">自訂售價</option>
                        </select>
                      </label>
                      {q.priceSource === "custom" && (
                        <label className="text-xs">
                          自訂金額
                          <input
                            type="number"
                            min={0}
                            value={q.customPrice ?? ""}
                            onChange={(e) =>
                              updateQueueItem(q.product.id, {
                                customPrice: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="ml-1 h-9 w-24 rounded-lg border border-border px-2 text-sm"
                          />
                        </label>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromQueue(q.product.id)}
                      >
                        移除
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Template / size / fields */}
          <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Tag className="h-4 w-4 text-primary" />
              模板與版面
            </h2>

            <div className="mb-4 flex flex-wrap gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.code ?? tpl.name}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    template.code === tpl.code || template.name === tpl.name
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-background hover:border-primary"
                  )}
                >
                  {tpl.name}
                </button>
              ))}
            </div>

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

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs">
                商品名稱字級（pt）
                <input
                  type="range"
                  min={8}
                  max={28}
                  value={template.name_font_size}
                  onChange={(e) => patchTemplate("name_font_size", Number(e.target.value))}
                  className="mt-2 w-full"
                />
                <span className="text-foreground-secondary">{template.name_font_size}pt</span>
              </label>
              <label className="text-xs">
                價格字級（pt）
                <input
                  type="range"
                  min={12}
                  max={48}
                  value={template.price_font_size}
                  onChange={(e) => patchTemplate("price_font_size", Number(e.target.value))}
                  className="mt-2 w-full"
                />
                <span className="text-foreground-secondary">{template.price_font_size}pt</span>
              </label>
              <label className="text-xs">
                價格字重
                <select
                  value={template.price_font_weight}
                  onChange={(e) =>
                    patchTemplate(
                      "price_font_weight",
                      e.target.value as LabelTemplateConfig["price_font_weight"]
                    )
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
                >
                  <option value="normal">一般</option>
                  <option value="bold">粗體</option>
                  <option value="black">超粗體</option>
                </select>
              </label>
            </div>

            <div className="mb-4 flex flex-wrap gap-3">
              <label className="text-xs">
                條碼類型
                <select
                  value={template.barcode_type}
                  onChange={(e) =>
                    patchTemplate(
                      "barcode_type",
                      e.target.value as LabelTemplateConfig["barcode_type"]
                    )
                  }
                  className="ml-2 h-9 rounded-lg border border-border px-2 text-sm"
                >
                  <option value="CODE128">Code128</option>
                  <option value="EAN13">EAN13</option>
                  <option value="QR">QR Code</option>
                </select>
              </label>
              <label className="text-xs">
                紙張
                <select
                  value={paperMode}
                  onChange={(e) => setPaperMode(e.target.value as LabelPaperMode)}
                  className="ml-2 h-9 rounded-lg border border-border px-2 text-sm"
                >
                  <option value="label">標籤紙／熱感機（單張尺寸）</option>
                  <option value="a4">A4 拼版</option>
                </select>
              </label>
              {template.show_promo_text && (
                <label className="text-xs">
                  促銷文字
                  <input
                    value={template.promo_text ?? ""}
                    onChange={(e) => patchTemplate("promo_text", e.target.value)}
                    className="ml-2 h-9 w-32 rounded-lg border border-border px-2 text-sm"
                  />
                </label>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {FIELD_TOGGLES.map((f) => (
                <label key={f.key} className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(template[f.configKey])}
                    onChange={(e) =>
                      patchTemplate(f.configKey, e.target.checked as never)
                    }
                  />
                  {f.label}
                </label>
              ))}
            </div>

            <p className="mt-4 text-xs text-foreground-secondary">
              第一階段透過瀏覽器列印對話框輸出，相容 Brother／TSC／Zebra／EPSON 等（選對紙張尺寸即可）。
              QZ Tray 一鍵直連列印列為後續階段。
            </p>
          </section>
        </div>

        {/* Live preview */}
        <aside className="no-print xl:sticky xl:top-4 xl:self-start">
          <div className="rounded-[20px] border border-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold">即時預覽</h2>
            {previewItem ? (
              <LabelPreviewCard item={previewItem} template={template} className="mx-auto w-full max-w-[280px]" />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-foreground-secondary">
                加入商品後顯示預覽
              </div>
            )}
            <p className="mt-3 text-center text-xs text-foreground-secondary">
              {template.width_mm}×{template.height_mm} mm · {template.name}
            </p>
            <Button
              className="mt-4 w-full bg-primary hover:bg-[#E63D6A]"
              onClick={handlePrint}
              disabled={!queue.length || printing}
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
