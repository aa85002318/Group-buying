"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminBarcodeInput, type BarcodeProduct } from "@/components/admin/store/AdminBarcodeInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProductJoin = {
  id?: string;
  name?: string;
  sku?: string;
  barcode?: string;
  supplier_name?: string;
} | null;

export type StoreListItem = Record<string, unknown> & {
  id: string;
  products?: ProductJoin;
};

type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
};

type StoreRecordsClientProps = {
  title: string;
  description: string;
  resource: "batches" | "disposals" | "anomalies" | "returns" | "inventory";
  createLabel: string;
  fields: FieldDef[];
  listExtraParams?: Record<string, string>;
  showBarcode?: boolean;
};

export function StoreRecordsClient({
  title,
  description,
  resource,
  createLabel,
  fields,
  listExtraParams,
  showBarcode = true,
}: StoreRecordsClientProps) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<StoreListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ resource, ...(listExtraParams ?? {}) });
    const range = searchParams.get("range");
    const status = searchParams.get("status");
    const low = searchParams.get("low");
    if (range) params.set("range", range);
    if (status) params.set("status", status);
    if (low) params.set("low", low);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [resource, listExtraParams, searchParams, q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/store?${queryString}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setItems((data.items ?? []) as StoreListItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("new") === "1") setShowForm(true);
  }, [searchParams]);

  const onBarcode = (product: BarcodeProduct) => {
    setProductId(product.id);
    setProductName(product.name);
    setForm((prev) => ({
      ...prev,
      barcode: product.barcode ?? prev.barcode ?? "",
    }));
  };

  const submit = async () => {
    setMsg(null);
    setError(null);
    if (resource !== "inventory" && !productId) {
      setError("請先用條碼或手動指定商品");
      return;
    }
    const payload: Record<string, unknown> = { resource };
    if (productId) payload.product_id = productId;
    for (const f of fields) {
      const raw = form[f.key];
      if (f.required && !raw) {
        setError(`請填寫 ${f.label}`);
        return;
      }
      if (raw == null || raw === "") continue;
      payload[f.key] = f.type === "number" ? Number(raw) : raw;
    }

    const res = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "新增失敗");
      return;
    }
    setMsg("已新增");
    setShowForm(false);
    setForm({});
    setProductId(null);
    setProductName(null);
    void load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        description={description}
        actions={
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "關閉表單" : createLabel}
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋商品名稱／SKU／條碼"
          className="rounded-[10px]"
        />
        <Button type="button" variant="outline" onClick={() => void load()}>
          搜尋
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-[16px] border border-[#E9DED4] bg-[#FFF8F5] p-4">
          {showBarcode ? <AdminBarcodeInput onSelect={onBarcode} autoFocus /> : null}
          {productName ? (
            <p className="text-sm font-medium text-[#2F2925]">
              已選商品：{productName}
              <span className="ml-2 font-mono text-xs text-[#756B64]">{productId}</span>
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="或手動貼上 product_id（UUID）"
                value={productId ?? ""}
                onChange={(e) => {
                  setProductId(e.target.value || null);
                  setProductName(e.target.value ? "手動指定" : null);
                }}
              />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((f) =>
              f.type === "select" ? (
                <label key={f.key} className="space-y-1 text-sm">
                  <span className="text-[#756B64]">{f.label}</span>
                  <select
                    className="w-full rounded-[10px] border border-[#E9DED4] bg-white px-3 py-2"
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  >
                    <option value="">請選擇</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label key={f.key} className="space-y-1 text-sm">
                  <span className="text-[#756B64]">{f.label}</span>
                  <Input
                    type={f.type ?? "text"}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="rounded-[10px]"
                  />
                </label>
              )
            )}
          </div>
          {error ? <p className="text-sm text-[#C94C4C]">{error}</p> : null}
          {msg ? <p className="text-sm text-[#2E7D5B]">{msg}</p> : null}
          <Button type="button" onClick={() => void submit()}>
            送出
          </Button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-[#756B64]">載入中…</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-[16px] border border-[#E9DED4] bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF6F1] text-left text-[#756B64]">
                <tr>
                  <th className="px-4 py-3">商品</th>
                  <th className="px-4 py-3">詳情</th>
                  <th className="px-4 py-3">狀態</th>
                  <th className="px-4 py-3">時間</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-[#E9DED4]">
                    <td className="px-4 py-3 font-medium text-[#2F2925]">
                      {item.products?.name ?? String(item.product_id ?? "—")}
                      {item.products?.sku ? (
                        <span className="ml-2 text-xs text-[#756B64]">{item.products.sku}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-[#756B64]">
                      {item.batch_no ? `批號 ${String(item.batch_no)} · ` : ""}
                      {item.quantity != null ? `數量 ${String(item.quantity)}` : ""}
                      {item.expiry_date ? ` · 效期 ${String(item.expiry_date)}` : ""}
                      {item.reason ? ` · ${String(item.reason)}` : ""}
                      {item.description ? ` · ${String(item.description).slice(0, 40)}` : ""}
                      {item.anomaly_type ? ` · ${String(item.anomaly_type)}` : ""}
                    </td>
                    <td className="px-4 py-3">{String(item.status ?? "—")}</td>
                    <td className="px-4 py-3">
                      {item.created_at
                        ? new Date(String(item.created_at)).toLocaleString("zh-TW")
                        : item.updated_at
                          ? new Date(String(item.updated_at)).toLocaleString("zh-TW")
                          : "—"}
                    </td>
                  </tr>
                ))}
                {!items.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#756B64]">
                      尚無資料
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-[16px] border border-[#E9DED4] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[#2F2925]">
                    {item.products?.name ?? String(item.product_id ?? "—")}
                  </p>
                  <span className="rounded-full bg-[#FAF6F1] px-2 py-0.5 text-xs text-[#756B64]">
                    {String(item.status ?? "—")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#756B64]">
                  {item.quantity != null ? `數量 ${String(item.quantity)}` : ""}
                  {item.expiry_date ? ` · 效期 ${String(item.expiry_date)}` : ""}
                </p>
                {item.products?.supplier_name ? (
                  <p className="mt-1 text-xs text-[#756B64]">廠商 {item.products.supplier_name}</p>
                ) : null}
              </div>
            ))}
            {!items.length ? (
              <p className="text-center text-sm text-[#756B64]">尚無資料</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
