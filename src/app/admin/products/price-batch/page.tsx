"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { type PriceMode } from "@/lib/admin/product-batch";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PriceProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  status: string;
  price: number;
  sale_price: number | null;
  cost_price: number | null;
  original_price: number | null;
};

type PreviewItem = {
  productId: string;
  name: string;
  sku: string | null;
  ok: boolean;
  errors: string[];
  before: { price?: number; cost_price?: number | null };
  after: { price?: number; cost_price?: number | null };
};

const PRICE_MODES: Array<{ value: PriceMode; label: string }> = [
  { value: "set", label: "設為固定售價" },
  { value: "add_amount", label: "增加固定金額" },
  { value: "sub_amount", label: "減少固定金額" },
  { value: "add_percent", label: "增加百分比" },
  { value: "sub_percent", label: "減少百分比" },
];

export default function AdminProductPriceBatchPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[#8A94A6]">載入中…</p>}>
      <AdminProductPriceBatchInner />
    </Suspense>
  );
}

function AdminProductPriceBatchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";

  const initialIds = useMemo(
    () =>
      idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [idsParam]
  );

  const [products, setProducts] = useState<PriceProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [listQuery, setListQuery] = useState("");

  const [mode, setMode] = useState<PriceMode>("add_percent");
  const [value, setValue] = useState(10);
  const [round, setRound] = useState(true);
  const [updateCost, setUpdateCost] = useState(false);
  const [costValue, setCostValue] = useState(0);
  const [runMode, setRunMode] = useState<"all_or_nothing" | "skip_errors">("all_or_nothing");
  const [preview, setPreview] = useState<{
    total: number;
    executableCount: number;
    errorCount: number;
    items: PreviewItem[];
  } | null>(null);

  const load = useCallback(async (ids: string[]) => {
    if (!ids.length) {
      setProducts([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products/price-batch/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setProducts((data.products ?? []) as PriceProduct[]);
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(initialIds);
  }, [initialIds, load]);

  const filteredProducts = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q)
    );
  }, [products, listQuery]);

  const buildPatch = () => ({
    price: {
      enabled: true,
      mode,
      value,
      round,
      includeCost: updateCost,
      costValue: updateCost ? costValue : undefined,
    },
  });

  const runPreview = async () => {
    if (!products.length) return;
    setPreviewing(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/products/batch/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: products.map((p) => p.id),
          patch: buildPatch(),
          runMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "預覽失敗");
      const items = (data.preview?.items ?? []) as PreviewItem[];
      setPreview({
        total: items.length,
        executableCount: data.preview?.executableCount ?? 0,
        errorCount: data.preview?.errorCount ?? 0,
        items,
      });
      setMessage(`預覽完成：可執行 ${data.preview?.executableCount ?? 0}／共 ${items.length}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "預覽失敗");
    } finally {
      setPreviewing(false);
    }
  };

  const runExecute = async () => {
    if (!products.length) return;
    if (!confirm(`確定將價格變更寫入 ${products.length} 個商品？可於批次紀錄復原。`)) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/products/batch/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: products.map((p) => p.id),
          patch: buildPatch(),
          runMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setMessage(`已儲存：成功 ${data.success}、失敗 ${data.failed ?? 0}。`);
      if (data.jobId) {
        router.push(`/admin/products/batch-history?job=${data.jobId}`);
      } else {
        await load(products.map((p) => p.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = (id: string) => {
    const nextIds = products.filter((p) => p.id !== id).map((p) => p.id);
    const qs = nextIds.length ? `?ids=${nextIds.join(",")}` : "";
    router.replace(`/admin/products/price-batch${qs}`);
  };

  const modeHint =
    mode === "set"
      ? "所有商品售價將設為相同金額"
      : mode.includes("percent")
        ? "百分比範圍 0～100"
        : "以固定金額加減";

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="價格批次更改"
        description="一次調整多個商品的售價；支援固定金額、百分比加減，並可選擇同步更新成本。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/products">
              <Button variant="outline">返回商品總覽</Button>
            </Link>
            <Link href="/admin/products/batch-history">
              <Button variant="ghost">批次紀錄</Button>
            </Link>
          </div>
        }
      />

      {!initialIds.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-[#667085]">
          請先到{" "}
          <Link href="/admin/products" className="font-medium text-[#153E73] underline">
            商品總覽
          </Link>{" "}
          勾選商品，再按「價格批次更改」。
        </div>
      ) : null}

      {loading ? <p className="text-sm text-[#8A94A6]">載入中…</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      {products.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-semibold text-[#153E73]">已選 {products.length} 件</h2>
            </div>
            <input
              className="input-field h-9 w-full text-sm"
              placeholder="搜尋名稱／SKU／條碼"
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
            />
            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-1 rounded-lg px-2 py-2 hover:bg-[#F7F1E7]"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#153E73]">{p.name}</span>
                    <span className="block truncate text-[10px] text-[#8A94A6]">
                      {p.sku || "無 SKU"} · {formatCurrency(p.price)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 px-1 text-xs text-[#8A94A6] hover:text-[#F16458]"
                    onClick={() => removeProduct(p.id)}
                    title="移出清單"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </aside>

          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-base font-semibold text-[#153E73]">調價規則</h2>
              <p className="text-xs text-[#8A94A6]">{modeHint}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[#153E73]">調價方式</span>
                <select
                  className="input-field w-full"
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value as PriceMode);
                    setPreview(null);
                  }}
                >
                  {PRICE_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[#153E73]">
                  {mode.includes("percent") ? "百分比（%）" : "金額（元）"}
                </span>
                <input
                  className="input-field w-full"
                  type="number"
                  value={value}
                  onChange={(e) => {
                    setValue(Number(e.target.value));
                    setPreview(null);
                  }}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={round}
                onChange={(e) => {
                  setRound(e.target.checked);
                  setPreview(null);
                }}
              />
              四捨五入至整數
            </label>

            <div className="rounded-xl border border-[#E8E1D7] bg-[#FFFEFA] p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[#153E73]">
                <input
                  type="checkbox"
                  checked={updateCost}
                  onChange={(e) => {
                    setUpdateCost(e.target.checked);
                    setPreview(null);
                  }}
                />
                同時更新成本價（設為固定金額）
              </label>
              {updateCost ? (
                <input
                  className="input-field mt-2 w-full max-w-xs"
                  type="number"
                  min={0}
                  value={costValue}
                  onChange={(e) => {
                    setCostValue(Number(e.target.value));
                    setPreview(null);
                  }}
                />
              ) : null}
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[#153E73]">執行模式</span>
              <select
                className="input-field w-full max-w-md"
                value={runMode}
                onChange={(e) => setRunMode(e.target.value as typeof runMode)}
              >
                <option value="all_or_nothing">全部成功才執行</option>
                <option value="skip_errors">略過錯誤項目</option>
              </select>
            </label>

            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <Button type="button" variant="outline" onClick={() => void runPreview()} disabled={previewing}>
                {previewing ? "預覽中…" : "預覽變更"}
              </Button>
              <Button type="button" onClick={() => void runExecute()} disabled={saving}>
                {saving ? "儲存中…" : `確認寫入（${products.length}）`}
              </Button>
            </div>

            {preview ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#FFF5CC] text-left text-xs text-[#153E73]">
                    <tr>
                      <th className="px-3 py-2">商品</th>
                      <th className="px-3 py-2">原售價</th>
                      <th className="px-3 py-2">新售價</th>
                      <th className="px-3 py-2">原成本</th>
                      <th className="px-3 py-2">新成本</th>
                      <th className="px-3 py-2">狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.items.map((it) => {
                      const beforePrice = Number(it.before.price ?? 0);
                      const afterPrice = Number(it.after.price ?? beforePrice);
                      const delta = afterPrice - beforePrice;
                      return (
                        <tr
                          key={it.productId}
                          className={cn("border-t border-gray-100", !it.ok && "bg-red-50/60")}
                        >
                          <td className="px-3 py-2">
                            <p className="font-medium text-[#153E73]">{it.name}</p>
                            {it.sku ? <p className="text-[10px] text-[#8A94A6]">{it.sku}</p> : null}
                          </td>
                          <td className="px-3 py-2">{formatCurrency(beforePrice)}</td>
                          <td className="px-3 py-2">
                            {formatCurrency(afterPrice)}
                            {delta !== 0 ? (
                              <span className={cn("ml-1 text-xs", delta > 0 ? "text-green-700" : "text-red-600")}>
                                ({delta > 0 ? "+" : ""}
                                {formatCurrency(delta)})
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2">
                            {it.before.cost_price != null ? formatCurrency(Number(it.before.cost_price)) : "—"}
                          </td>
                          <td className="px-3 py-2">
                            {it.after.cost_price != null ? formatCurrency(Number(it.after.cost_price)) : "—"}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {it.ok ? "✅" : it.errors.join("；")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="border-t border-gray-100 px-3 py-2 text-xs text-[#8A94A6]">
                  可執行 {preview.executableCount}／錯誤 {preview.errorCount}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
