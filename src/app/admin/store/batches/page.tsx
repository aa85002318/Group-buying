"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminBarcodeInput, type BarcodeProduct } from "@/components/admin/store/AdminBarcodeInput";
import { AdminImportPreview } from "@/components/admin/store/AdminImportPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { daysUntil, expiryStatusLabel, todayISO } from "@/lib/admin/store-ops";
import { cn } from "@/lib/utils";

type BatchRow = {
  id: string;
  batch_no: string;
  barcode?: string | null;
  quantity: number;
  remaining_quantity?: number | null;
  expiry_date?: string | null;
  location?: string | null;
  status?: string | null;
  cost_price?: number | null;
  product_id: string;
  products?: {
    id?: string;
    name?: string;
    sku?: string;
    barcode?: string;
    unit?: string | null;
  } | null;
};

type ReceiveForm = {
  batch_no: string;
  quantity: string;
  cost_price: string;
  manufactured_at: string;
  expiry_date: string;
  location: string;
  notes: string;
};

function BatchesPageInner() {
  const searchParams = useSearchParams();
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [range, setRange] = useState(searchParams.get("range") ?? "");
  const [showReceive, setShowReceive] = useState(searchParams.get("receive") === "1");
  const [showImport, setShowImport] = useState(searchParams.get("tab") === "import");
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [form, setForm] = useState<ReceiveForm>({
    batch_no: "",
    quantity: "",
    cost_price: "",
    manufactured_at: "",
    expiry_date: "",
    location: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (range) params.set("range", range);
      const res = await fetch(`/api/admin/store/batches?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setBatches(data.batches ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [q, range]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitReceive = async () => {
    if (!product) {
      alert("請先掃條碼或搜尋商品主檔中的商品");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/store/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          barcode: product.barcode ?? form.batch_no,
          batch_no: form.batch_no,
          quantity: Number(form.quantity),
          cost_price: form.cost_price ? Number(form.cost_price) : null,
          manufactured_at: form.manufactured_at || null,
          expiry_date: form.expiry_date || null,
          location: form.location || null,
          notes: form.notes || null,
          received_at: todayISO(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "進貨失敗");
      setShowReceive(false);
      setProduct(null);
      setForm({
        batch_no: "",
        quantity: "",
        cost_price: "",
        manufactured_at: "",
        expiry_date: "",
        location: "",
        notes: "",
      });
      await load();
      if (data.batch?.id) {
        window.location.href = `/admin/store/batches/${data.batch.id}`;
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "進貨失敗");
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(() => batches, [batches]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="批次管理"
        description="Store Ops 以批次為核心。商品請至商品主檔建立；此處只引用 products 並新增批次。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => setShowReceive((v) => !v)}>
              {showReceive ? "關閉進貨" : "快速進貨"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowImport((v) => !v)}>
              批次匯入
            </Button>
            <Link href="/admin/products">
              <Button type="button" variant="secondary">
                商品主檔
              </Button>
            </Link>
          </div>
        }
      />

      {showReceive ? (
        <section className="space-y-4 rounded-[16px] border border-[#E9DED4] bg-[#FFF8F5] p-4">
          <h2 className="font-semibold text-[#2F2925]">快速進貨（不建立商品）</h2>
          <AdminBarcodeInput
            onSelect={(p) => setProduct(p)}
            autoFocus
          />
          {product ? (
            <p className="text-sm">
              已選商品：
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="ml-1 font-medium text-primary hover:underline"
              >
                {product.name}
              </Link>
              <span className="ml-2 font-mono text-xs text-[#756B64]">
                {product.barcode ?? product.sku}
              </span>
            </p>
          ) : (
            <p className="text-sm text-[#756B64]">
              掃條碼後若找不到商品，請先到{" "}
              <Link href="/admin/products/new" className="text-primary underline">
                /admin/products
              </Link>{" "}
              新增，再回來進貨。
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["batch_no", "批號", "text"],
                ["quantity", "數量", "number"],
                ["cost_price", "成本", "number"],
                ["manufactured_at", "製造日", "date"],
                ["expiry_date", "效期", "date"],
                ["location", "位置", "text"],
              ] as const
            ).map(([key, label, type]) => (
              <label key={key} className="space-y-1 text-sm">
                <span className="text-[#756B64]">{label}</span>
                <Input
                  type={type}
                  className="rounded-[10px]"
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </label>
            ))}
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-[#756B64]">備註</span>
              <Input
                className="rounded-[10px]"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </label>
          </div>
          <Button type="button" disabled={saving || !product} onClick={() => void submitReceive()}>
            {saving ? "儲存中…" : "完成進貨"}
          </Button>
        </section>
      ) : null}

      {showImport ? (
        <section className="rounded-[16px] border border-[#E9DED4] bg-white p-4">
          <h2 className="mb-2 font-semibold text-[#2F2925]">批次匯入（依條碼找商品）</h2>
          <p className="mb-3 text-sm text-[#756B64]">
            欄位：條碼、批次、數量、製造日、效期、位置、成本。找不到商品的列會列入錯誤，不會新建商品。
            商品主檔匯入請用{" "}
            <Link href="/admin/products/import" className="text-primary underline">
              /admin/products/import
            </Link>
            。
          </p>
          <AdminImportPreview importType="expiry" onCommitted={() => void load()} />
        </section>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋商品／條碼／批號／儲位"
          className="rounded-[10px] sm:max-w-xs"
        />
        <select
          className="rounded-[10px] border border-[#E9DED4] bg-white px-3 py-2 text-sm"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="">全部效期</option>
          <option value="7">7 天內到期</option>
          <option value="30">30 天內到期</option>
          <option value="expired">已過期</option>
        </select>
        <Button type="button" variant="outline" onClick={() => void load()}>
          搜尋
        </Button>
      </div>

      {error ? <p className="text-sm text-[#C94C4C]">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-[#756B64]">載入中…</p>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-[#E9DED4] bg-white">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-[#FAF6F1] text-left text-[#756B64]">
              <tr>
                <th className="px-3 py-3">商品</th>
                <th className="px-3 py-3">批次</th>
                <th className="px-3 py-3">到期日</th>
                <th className="px-3 py-3">位置</th>
                <th className="px-3 py-3">剩餘</th>
                <th className="px-3 py-3">天數</th>
                <th className="px-3 py-3">狀態</th>
                <th className="px-3 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const days = daysUntil(b.expiry_date);
                const label = expiryStatusLabel(days);
                const remaining = Number(b.remaining_quantity ?? b.quantity ?? 0);
                return (
                  <tr key={b.id} className="border-t border-[#E9DED4]">
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/products/${b.product_id}/edit`}
                        className="font-medium text-[#2F2925] hover:text-primary hover:underline"
                      >
                        {b.products?.name ?? "—"}
                      </Link>
                      <p className="font-mono text-xs text-[#756B64]">
                        {b.products?.barcode ?? b.products?.sku ?? ""}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{b.batch_no}</td>
                    <td className="px-3 py-3">{b.expiry_date ?? "—"}</td>
                    <td className="px-3 py-3">{b.location ?? "—"}</td>
                    <td className="px-3 py-3">
                      {remaining}
                      {b.products?.unit ? ` ${b.products.unit}` : ""}
                    </td>
                    <td className="px-3 py-3">{days == null ? "—" : `${days}天`}</td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          label === "已過期" || label === "緊急"
                            ? "bg-red-50 text-red-700"
                            : label === "即將到期"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-[#FAF6F1] text-[#756B64]"
                        )}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Link href={`/admin/store/batches/${b.id}`}>
                          <Button size="sm" variant="secondary">
                            查看
                          </Button>
                        </Link>
                        <Link href={`/admin/store/disposals?new=1&batch_id=${b.id}&product_id=${b.product_id}`}>
                          <Button size="sm" variant="ghost">
                            報廢
                          </Button>
                        </Link>
                        <Link href={`/admin/store/returns?new=1&batch_id=${b.id}&product_id=${b.product_id}`}>
                          <Button size="sm" variant="ghost">
                            退貨
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-[#756B64]">
                    尚無批次。請用「快速進貨」掃條碼建立批次。
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

export default function StoreBatchesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#756B64]">載入中…</p>}>
      <BatchesPageInner />
    </Suspense>
  );
}
