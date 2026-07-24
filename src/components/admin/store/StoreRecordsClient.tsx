"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminBarcodeInput, type BarcodeProduct } from "@/components/admin/store/AdminBarcodeInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { daysUntil, expiryStatusLabel } from "@/lib/admin/store-ops";

type ProductJoin = {
  id?: string;
  name?: string;
  sku?: string;
  barcode?: string;
  unit?: string | null;
} | null;

export type StoreListItem = Record<string, unknown> & {
  id: string;
  product_id?: string;
  batch_id?: string | null;
  batch_no?: string | null;
  quantity?: number | null;
  remaining_quantity?: number | null;
  expiry_date?: string | null;
  location?: string | null;
  status?: string | null;
  reason?: string | null;
  description?: string | null;
  anomaly_type?: string | null;
  created_at?: string;
  updated_at?: string;
  products?: ProductJoin;
};

type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
};

type BatchOption = {
  id: string;
  batch_no: string;
  remaining_quantity?: number | null;
  quantity?: number | null;
  expiry_date?: string | null;
  location?: string | null;
};

type StoreRecordsClientProps = {
  title: string;
  description: string;
  resource: "batches" | "disposals" | "anomalies" | "returns" | "inventory";
  createLabel: string;
  fields: FieldDef[];
  listExtraParams?: Record<string, string>;
  showBarcode?: boolean;
  /** V2: require selecting a batch after product (disposals/returns/anomalies) */
  requireBatch?: boolean;
  /** Expiry-focused columns */
  expiryColumns?: boolean;
};

export function StoreRecordsClient({
  title,
  description,
  resource,
  createLabel,
  fields,
  listExtraParams,
  showBarcode = true,
  requireBatch = false,
  expiryColumns = false,
}: StoreRecordsClientProps) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<StoreListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batches, setBatches] = useState<BatchOption[]>([]);
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
    const pid = searchParams.get("product_id");
    const bid = searchParams.get("batch_id");
    if (pid) {
      setProductId(pid);
      setProductName("來自批次連結");
    }
    if (bid) setBatchId(bid);
  }, [searchParams]);

  useEffect(() => {
    if (!productId || !requireBatch) {
      setBatches([]);
      return;
    }
    fetch(`/api/admin/store/batches?product_id=${productId}&status=active`)
      .then((r) => r.json())
      .then((d) => setBatches(d.batches ?? []))
      .catch(() => setBatches([]));
  }, [productId, requireBatch]);

  const onBarcode = (product: BarcodeProduct) => {
    setProductId(product.id);
    setProductName(product.name);
    setBatchId(null);
    setForm((prev) => ({
      ...prev,
      barcode: product.barcode ?? prev.barcode ?? "",
    }));
  };

  const submit = async () => {
    setMsg(null);
    setError(null);
    if (resource !== "inventory" && !productId) {
      setError("請先掃條碼選取商品主檔中的商品（不會在此新增商品）");
      return;
    }
    if (requireBatch && !batchId) {
      setError("請選擇批次。報廢／退貨／異常必須指定批次。");
      return;
    }
    const payload: Record<string, unknown> = { resource };
    if (productId) payload.product_id = productId;
    if (batchId) payload.batch_id = batchId;
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
    setBatchId(null);
    void load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/store/batches">
              <Button type="button" variant="outline">
                批次管理
              </Button>
            </Link>
            <Link href="/admin/products">
              <Button type="button" variant="secondary">
                商品主檔
              </Button>
            </Link>
            <Button type="button" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "關閉表單" : createLabel}
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋商品名稱／SKU／條碼／批號"
          className="rounded-[10px]"
        />
        <Button type="button" variant="outline" onClick={() => void load()}>
          搜尋
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-[16px] border border-[#E9DED4] bg-[#FFF8F5] p-4">
          <p className="text-xs text-[#756B64]">
            僅引用 Product Master。找不到商品請至{" "}
            <Link href="/admin/products/new" className="text-primary underline">
              /admin/products
            </Link>{" "}
            新增。
          </p>
          {showBarcode ? <AdminBarcodeInput onSelect={onBarcode} autoFocus /> : null}
          {productName ? (
            <p className="text-sm font-medium text-[#2F2925]">
              已選商品：
              {productId ? (
                <Link
                  href={`/admin/products/${productId}/edit`}
                  className="ml-1 text-primary hover:underline"
                >
                  {productName}
                </Link>
              ) : (
                productName
              )}
            </p>
          ) : null}

          {requireBatch && productId ? (
            <label className="block space-y-1 text-sm">
              <span className="text-[#756B64]">選擇批次（必填）</span>
              <select
                className="w-full rounded-[10px] border border-[#E9DED4] bg-white px-3 py-2"
                value={batchId ?? ""}
                onChange={(e) => setBatchId(e.target.value || null)}
              >
                <option value="">請選擇批次</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_no}
                    {b.expiry_date ? ` · 效期 ${b.expiry_date}` : ""}
                    {` · 剩餘 ${b.remaining_quantity ?? b.quantity ?? 0}`}
                    {b.location ? ` · ${b.location}` : ""}
                  </option>
                ))}
              </select>
              {!batches.length ? (
                <span className="text-xs text-[#C94C4C]">
                  此商品尚無有效批次，請先至批次管理快速進貨。
                </span>
              ) : null}
            </label>
          ) : null}

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
        <div className="overflow-x-auto rounded-[16px] border border-[#E9DED4] bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-[#FAF6F1] text-left text-[#756B64]">
              <tr>
                <th className="px-4 py-3">商品</th>
                <th className="px-4 py-3">批次</th>
                {expiryColumns ? (
                  <>
                    <th className="px-4 py-3">到期日</th>
                    <th className="px-4 py-3">剩餘</th>
                    <th className="px-4 py-3">天數</th>
                  </>
                ) : (
                  <th className="px-4 py-3">詳情</th>
                )}
                <th className="px-4 py-3">狀態</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const days = expiryColumns ? daysUntil(item.expiry_date as string) : null;
                const remaining = Number(item.remaining_quantity ?? item.quantity ?? 0);
                const batchHref = item.id && resource === "batches"
                  ? `/admin/store/batches/${item.id}`
                  : item.batch_id
                    ? `/admin/store/batches/${item.batch_id}`
                    : null;
                return (
                  <tr key={item.id} className="border-t border-[#E9DED4]">
                    <td className="px-4 py-3 font-medium text-[#2F2925]">
                      {item.product_id ? (
                        <Link
                          href={`/admin/products/${item.product_id}/edit`}
                          className="hover:text-primary hover:underline"
                        >
                          {item.products?.name ?? String(item.product_id)}
                        </Link>
                      ) : (
                        item.products?.name ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {batchHref ? (
                        <Link href={batchHref} className="text-primary hover:underline">
                          {String(item.batch_no ?? item.batch_id ?? "查看批次")}
                        </Link>
                      ) : (
                        String(item.batch_no ?? "—")
                      )}
                    </td>
                    {expiryColumns ? (
                      <>
                        <td className="px-4 py-3">{String(item.expiry_date ?? "—")}</td>
                        <td className="px-4 py-3">{remaining}</td>
                        <td className="px-4 py-3">
                          {days == null ? "—" : `${days}天`}
                          <span className="ml-1 text-xs text-[#756B64]">
                            {expiryStatusLabel(days)}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td className="px-4 py-3 text-[#756B64]">
                        {item.quantity != null ? `數量 ${String(item.quantity)}` : ""}
                        {item.reason ? ` · ${String(item.reason)}` : ""}
                        {item.description ? ` · ${String(item.description).slice(0, 40)}` : ""}
                        {item.anomaly_type ? ` · ${String(item.anomaly_type)}` : ""}
                      </td>
                    )}
                    <td className="px-4 py-3">{String(item.status ?? "—")}</td>
                    <td className="px-4 py-3">
                      {batchHref ? (
                        <Link href={batchHref} className="text-xs text-primary hover:underline">
                          查看批次
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
              {!items.length ? (
                <tr>
                  <td colSpan={expiryColumns ? 7 : 5} className="px-4 py-8 text-center text-[#756B64]">
                    尚無資料
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
