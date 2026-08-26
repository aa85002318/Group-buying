"use client";

import { useEffect, useMemo, useState } from "react";
import { CategoryGroupedPicker } from "@/components/admin/CategoryGroupedPicker";
import { Button } from "@/components/ui/button";
import {
  PRODUCT_BATCH_SHIP_KEYS,
  SHIP_LABELS,
  type BatchTextOp,
  type InfoMode,
  type PriceMode,
  type ProductBatchPatch,
  type ShipKey,
} from "@/lib/admin/product-batch";
import type { ProductCategory } from "@/lib/types/database";

type PreviewItem = {
  productId: string;
  name: string;
  sku: string | null;
  ok: boolean;
  errors: string[];
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

type Props = {
  open: boolean;
  selectedCount: number;
  productIds: string[];
  categories: ProductCategory[];
  onClose: () => void;
  onDone: () => void;
};

const emptyPatch = (): ProductBatchPatch => ({});

export function ProductBatchDrawer({ open, selectedCount, productIds, categories, onClose, onDone }: Props) {
  const [patch, setPatch] = useState<ProductBatchPatch>(emptyPatch);
  const [runMode, setRunMode] = useState<"all_or_nothing" | "skip_errors">("all_or_nothing");
  const [preview, setPreview] = useState<{ items: PreviewItem[]; executableCount: number; errorCount: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Array<{ template_key: string; name: string }>>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/products/description-templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .catch(() => {});
  }, [open]);

  const enabledCount = useMemo(
    () => Object.values(patch).filter((f) => f && typeof f === "object" && "enabled" in f && f.enabled).length,
    [patch]
  );

  if (!open) return null;

  const previewRun = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products/batch/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds, patch, runMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "預覽失敗");
      setPreview(data.preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "預覽失敗");
    } finally {
      setBusy(false);
    }
  };

  const execute = async () => {
    if (patch.info?.enabled && patch.info.mode === "overwrite") {
      if (!confirm("警告：將覆蓋完整商品資訊，確定繼續？")) return;
    }
    if (!confirm(`確定套用至 ${selectedCount} 件商品？`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products/batch/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds, patch, runMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "執行失敗");
      alert(`完成：成功 ${data.success}、失敗 ${data.failed}`);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "執行失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/30">
      <button className="flex-1" aria-label="關閉" onClick={onClose} />
      <aside className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-[#FFFEFA] shadow-2xl">
        <header className="border-b border-[#E8E1D7] bg-white px-5 py-4">
          <h2 className="text-lg font-black text-[#153E73]">批次編輯商品</h2>
          <p className="text-sm text-[#8A94A6]">已選取 {selectedCount} 件商品 · 已啟用 {enabledCount} 個欄位</p>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <EnableBlock
            label="商品狀態"
            enabled={Boolean(patch.status?.enabled)}
            onEnabled={(enabled) => setPatch((p) => ({ ...p, status: { enabled, value: p.status?.value ?? "draft" } }))}
          >
            <select
              className="input-field"
              value={patch.status?.value ?? "draft"}
              onChange={(e) => setPatch((p) => ({ ...p, status: { enabled: true, value: e.target.value as never } }))}
            >
              <option value="draft">草稿</option>
              <option value="active">上架</option>
              <option value="inactive">下架</option>
              <option value="scheduled_publish">預約上架（立即上架並記錄）</option>
              <option value="scheduled_unpublish">預約下架（立即下架並記錄）</option>
            </select>
          </EnableBlock>

          <TextBlock
            label="商品名稱"
            ops={["replace", "prefix", "suffix", "search_replace"]}
            field={patch.name}
            onChange={(name) => setPatch((p) => ({ ...p, name: { ...name, op: name.op as BatchTextOp } }))}
          />
          <TextBlock
            label="商品副標"
            ops={["replace", "prefix", "suffix", "search_replace", "clear"]}
            field={patch.subtitle}
            onChange={(subtitle) =>
              setPatch((p) => ({ ...p, subtitle: { ...subtitle, op: subtitle.op as BatchTextOp } }))
            }
          />
          <TextBlock
            label="商品 SKU"
            ops={["prefix", "suffix", "search_replace", "regenerate"]}
            field={patch.sku}
            onChange={(sku) =>
              setPatch((p) => ({
                ...p,
                sku: { ...sku, op: sku.op as "prefix" | "suffix" | "search_replace" | "regenerate" },
              }))
            }
          />

          <EnableBlock
            label="商品分類"
            enabled={Boolean(patch.categories?.enabled)}
            onEnabled={(enabled) =>
              setPatch((p) => ({
                ...p,
                categories: { enabled, mode: p.categories?.mode ?? "add", categoryIds: p.categories?.categoryIds ?? [] },
              }))
            }
          >
            <select
              className="input-field mb-2"
              value={patch.categories?.mode ?? "add"}
              onChange={(e) =>
                setPatch((p) => ({
                  ...p,
                  categories: {
                    enabled: true,
                    mode: e.target.value as "replace" | "add" | "remove",
                    categoryIds: p.categories?.categoryIds ?? [],
                  },
                }))
              }
            >
              <option value="replace">取代原有分類</option>
              <option value="add">新增分類並保留原分類</option>
              <option value="remove">移除指定分類</option>
            </select>
            <CategoryGroupedPicker
              categories={categories}
              selectedIds={patch.categories?.categoryIds ?? []}
              onChange={(categoryIds) =>
                setPatch((p) => ({
                  ...p,
                  categories: { enabled: true, mode: p.categories?.mode ?? "add", categoryIds },
                }))
              }
            />
          </EnableBlock>

          <EnableBlock
            label="配送方式"
            enabled={Boolean(patch.shipping?.enabled)}
            onEnabled={(enabled) =>
              setPatch((p) => ({
                ...p,
                shipping: { enabled, mode: p.shipping?.mode ?? "add", keys: p.shipping?.keys ?? [] },
              }))
            }
          >
            <select
              className="input-field mb-2"
              value={patch.shipping?.mode ?? "add"}
              onChange={(e) =>
                setPatch((p) => ({
                  ...p,
                  shipping: { enabled: true, mode: e.target.value as never, keys: p.shipping?.keys ?? [] },
                }))
              }
            >
              <option value="replace">取代原有配送方式</option>
              <option value="add">新增配送方式</option>
              <option value="remove">移除配送方式</option>
            </select>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_BATCH_SHIP_KEYS.map((key) => {
                const on = patch.shipping?.keys?.includes(key);
                return (
                  <label key={key} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(on)}
                      onChange={(e) => {
                        const keys = new Set(patch.shipping?.keys ?? []);
                        if (e.target.checked) keys.add(key);
                        else keys.delete(key);
                        setPatch((p) => ({
                          ...p,
                          shipping: { enabled: true, mode: p.shipping?.mode ?? "add", keys: Array.from(keys) as ShipKey[] },
                        }));
                      }}
                    />
                    {SHIP_LABELS[key]}
                  </label>
                );
              })}
            </div>
          </EnableBlock>

          <EnableBlock
            label="售價"
            enabled={Boolean(patch.price?.enabled)}
            onEnabled={(enabled) =>
              setPatch((p) => ({
                ...p,
                price: { enabled, mode: p.price?.mode ?? "add_percent", value: p.price?.value ?? 10, round: true },
              }))
            }
          >
            <select
              className="input-field mb-2"
              value={patch.price?.mode ?? "add_percent"}
              onChange={(e) =>
                setPatch((p) => ({
                  ...p,
                  price: {
                    enabled: true,
                    mode: e.target.value as PriceMode,
                    value: p.price?.value ?? 0,
                    round: p.price?.round,
                    includeCost: p.price?.includeCost,
                    costValue: p.price?.costValue,
                  },
                }))
              }
            >
              <option value="set">設為固定售價</option>
              <option value="add_amount">增加固定金額</option>
              <option value="sub_amount">減少固定金額</option>
              <option value="add_percent">增加百分比</option>
              <option value="sub_percent">減少百分比</option>
            </select>
            <input
              className="input-field"
              type="number"
              value={patch.price?.value ?? 0}
              onChange={(e) =>
                setPatch((p) => ({
                  ...p,
                  price: {
                    enabled: true,
                    mode: p.price?.mode ?? "add_percent",
                    value: Number(e.target.value),
                    round: p.price?.round,
                    includeCost: p.price?.includeCost,
                    costValue: p.price?.costValue,
                  },
                }))
              }
            />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(patch.price?.round)}
                onChange={(e) =>
                  setPatch((p) => ({
                    ...p,
                    price: {
                      enabled: true,
                      mode: p.price?.mode ?? "add_percent",
                      value: p.price?.value ?? 0,
                      round: e.target.checked,
                      includeCost: p.price?.includeCost,
                      costValue: p.price?.costValue,
                    },
                  }))
                }
              />
              四捨五入至整數
            </label>
          </EnableBlock>

          <EnableBlock
            label="商品資訊"
            enabled={Boolean(patch.info?.enabled)}
            onEnabled={(enabled) =>
              setPatch((p) => ({
                ...p,
                info: { enabled, mode: p.info?.mode ?? "suffix", value: p.info?.value ?? "" },
              }))
            }
          >
            <select
              className="input-field mb-2"
              value={patch.info?.mode ?? "suffix"}
              onChange={(e) =>
                setPatch((p) => ({
                  ...p,
                  info: {
                    enabled: true,
                    mode: e.target.value as InfoMode,
                    value: p.info?.value ?? "",
                    find: p.info?.find,
                    templateKey: p.info?.templateKey,
                  },
                }))
              }
            >
              <option value="prefix">在內容前方加入</option>
              <option value="suffix">在內容後方加入</option>
              <option value="search_replace">搜尋並取代</option>
              <option value="clear_paragraph">清除指定段落</option>
              <option value="apply_style">套用商品資訊樣式公版</option>
              <option value="overwrite">覆蓋完整商品資訊</option>
            </select>
            {patch.info?.mode === "search_replace" ? (
              <input
                className="input-field mb-2"
                placeholder="搜尋文字"
                value={patch.info.find ?? ""}
                onChange={(e) =>
                  setPatch((p) => ({
                    ...p,
                    info: {
                      enabled: true,
                      mode: "search_replace",
                      value: p.info?.value ?? "",
                      find: e.target.value,
                      templateKey: p.info?.templateKey,
                    },
                  }))
                }
              />
            ) : null}
            {patch.info?.mode === "apply_style" ? (
              <select
                className="input-field"
                value={patch.info.templateKey ?? ""}
                onChange={(e) =>
                  setPatch((p) => ({
                    ...p,
                    info: {
                      enabled: true,
                      mode: "apply_style",
                      value: p.info?.value ?? "",
                      find: p.info?.find,
                      templateKey: e.target.value,
                    },
                  }))
                }
              >
                <option value="">選擇公版</option>
                {templates.map((t) => (
                  <option key={t.template_key} value={t.template_key}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                className="input-field min-h-24"
                value={patch.info?.value ?? ""}
                onChange={(e) =>
                  setPatch((p) => ({
                    ...p,
                    info: {
                      enabled: true,
                      mode: p.info?.mode ?? "suffix",
                      value: e.target.value,
                      find: p.info?.find,
                      templateKey: p.info?.templateKey,
                    },
                  }))
                }
              />
            )}
            {patch.info?.mode === "overwrite" ? (
              <p className="mt-2 text-sm font-bold text-[#F16458]">將覆蓋完整商品資訊，執行前會再確認。</p>
            ) : null}
          </EnableBlock>

          <label className="block text-sm">
            執行模式
            <select
              className="input-field mt-1"
              value={runMode}
              onChange={(e) => setRunMode(e.target.value as never)}
            >
              <option value="all_or_nothing">全部商品驗證成功才執行</option>
              <option value="skip_errors">跳過錯誤商品，執行其他商品</option>
            </select>
          </label>

          {error ? <p className="text-sm text-[#F16458]">{error}</p> : null}

          {preview ? (
            <div className="rounded-2xl border border-[#E8E1D7] bg-white p-3 text-sm">
              <p className="font-bold text-[#153E73]">
                可執行 {preview.executableCount} 筆 · 不可執行 {preview.errorCount} 筆
              </p>
              <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                {preview.items.slice(0, 40).map((item) => (
                  <li key={item.productId} className="border-b border-[#F3EEE6] pb-2">
                    <p className="font-medium">
                      {item.name} <span className="text-xs text-[#8A94A6]">{item.sku}</span>
                    </p>
                    {item.ok ? (
                      <p className="text-xs text-emerald-700">可執行</p>
                    ) : (
                      <p className="text-xs text-[#F16458]">{item.errors.join("、")}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <footer className="sticky bottom-0 flex gap-2 border-t border-[#E8E1D7] bg-white p-4">
          <Button className="flex-1 bg-[#FFD454] text-[#153E73] hover:bg-[#FCCA30]" disabled={busy} onClick={() => void previewRun()}>
            {busy ? "處理中…" : "預覽修改"}
          </Button>
          <Button className="flex-1" disabled={busy || !preview} onClick={() => void execute()}>
            確認執行
          </Button>
          <Button variant="outline" onClick={onClose}>
            關閉
          </Button>
        </footer>
      </aside>
    </div>
  );
}

function EnableBlock({
  label,
  enabled,
  onEnabled,
  children,
}: {
  label: string;
  enabled: boolean;
  onEnabled: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E8E1D7] bg-white p-3">
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#153E73]">
        <input type="checkbox" checked={enabled} onChange={(e) => onEnabled(e.target.checked)} />
        啟用修改 · {label}
      </label>
      <fieldset disabled={!enabled} className={enabled ? "" : "opacity-50"}>
        {children}
      </fieldset>
    </section>
  );
}

function TextBlock({
  label,
  ops,
  field,
  onChange,
}: {
  label: string;
  ops: string[];
  field?: { enabled: boolean; op: string; value: string; find?: string };
  onChange: (v: { enabled: boolean; op: string; value: string; find?: string }) => void;
}) {
  const enabled = Boolean(field?.enabled);
  return (
    <EnableBlock
      label={label}
      enabled={enabled}
      onEnabled={(next) => onChange({ enabled: next, op: field?.op ?? ops[0], value: field?.value ?? "", find: field?.find })}
    >
      <select
        className="input-field mb-2"
        value={field?.op ?? ops[0]}
        onChange={(e) => onChange({ enabled: true, op: e.target.value, value: field?.value ?? "", find: field?.find })}
      >
        {ops.map((op) => (
          <option key={op} value={op}>
            {op === "replace" ? "直接覆蓋" : op === "prefix" ? "加上前綴" : op === "suffix" ? "加上後綴" : op === "search_replace" ? "搜尋並取代" : op === "clear" ? "清除" : "依規則重新產生"}
          </option>
        ))}
      </select>
      {field?.op === "search_replace" ? (
        <input
          className="input-field mb-2"
          placeholder="搜尋文字"
          value={field.find ?? ""}
          onChange={(e) => onChange({ enabled: true, op: field.op, value: field.value, find: e.target.value })}
        />
      ) : null}
      {field?.op !== "regenerate" && field?.op !== "clear" ? (
        <input
          className="input-field"
          placeholder="內容"
          value={field?.value ?? ""}
          onChange={(e) => onChange({ enabled: true, op: field?.op ?? ops[0], value: e.target.value, find: field?.find })}
        />
      ) : null}
    </EnableBlock>
  );
}
