"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StockLookupProduct = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  brand?: string | null;
  stock?: number | null;
  price?: number | null;
  unit?: string | null;
  image_url?: string | null;
  supplier_name?: string | null;
};

export type StockLookupStoreRow = {
  store_id: string;
  store_name: string;
  store_code?: string | null;
  quantity: number;
  available_quantity: number;
  batch_quantity: number;
  nearest_expiry?: string | null;
  batch_count: number;
};

type SelectedPayload = {
  product: StockLookupProduct;
  stores: StockLookupStoreRow[];
  total_quantity: number;
  note?: string;
};

export function StoreStockLookup({
  compact = false,
  className,
  initialQuery = "",
}: {
  compact?: boolean;
  className?: string;
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<StockLookupProduct[]>([]);
  const [selected, setSelected] = useState<SelectedPayload | null>(null);
  const [note, setNote] = useState(
    "查詢結果僅供參考，不會直接修改其他分店庫存。"
  );

  const runLookup = useCallback(async (query: string, productId?: string) => {
    const trimmed = query.trim();
    if (!trimmed && !productId) {
      setProducts([]);
      setSelected(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (productId) params.set("product_id", productId);
      else params.set("q", trimmed);
      const res = await fetch(`/api/admin/store/stock-lookup?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查詢失敗");
      setProducts(Array.isArray(data.products) ? data.products : []);
      setSelected(data.selected ?? null);
      if (data.note || data.selected?.note) {
        setNote(data.selected?.note || data.note);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "查詢失敗");
      setProducts([]);
      setSelected(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery.trim()) void runLookup(initialQuery);
  }, [initialQuery, runLookup]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <label className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-[#E6E9EF] bg-white px-3">
          <Search className="h-4 w-4 shrink-0 text-[#687386]" aria-hidden />
          <span className="sr-only">搜尋商品或條碼</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runLookup(q);
              }
            }}
            placeholder="搜尋商品／掃描條碼"
            className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#153E73] outline-none"
            autoFocus={!compact}
          />
        </label>
        <Button
          type="button"
          disabled={busy}
          onClick={() => void runLookup(q)}
          className="h-11 shrink-0 border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73] hover:bg-[#FFE149]/90"
        >
          {busy ? "查詢中…" : "查詢"}
        </Button>
      </div>

      <p className="text-[11px] text-[#687386]">{note}</p>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {products.length > 1 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#153E73]">多筆相符，請選擇商品</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {products.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                    selected?.product.id === p.id
                      ? "border-[#FFE149] bg-[#FFFBEA]"
                      : "border-[#E8EBF0] hover:bg-[#F7F8FA]"
                  )}
                  onClick={() => void runLookup(q, p.id)}
                >
                  <span className="font-semibold text-[#153E73]">{p.name}</span>
                  <span className="mt-0.5 block text-[11px] text-[#8A94A6]">
                    {[p.sku, p.barcode, p.brand].filter(Boolean).join(" · ") || "—"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {selected ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#FFE149]/50 bg-[#FFFBEA] px-3 py-3">
            <p className="font-bold text-[#153E73]">{selected.product.name}</p>
            <p className="mt-0.5 text-[11px] text-[#153E73]/70">
              {[selected.product.sku, selected.product.barcode, selected.product.brand]
                .filter(Boolean)
                .join(" · ") || "無條碼"}
              {selected.product.supplier_name
                ? ` · ${selected.product.supplier_name}`
                : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <span className="font-semibold text-[#153E73]">
                各店合計可供應{" "}
                <span className="text-lg">{selected.total_quantity}</span>
                {selected.product.unit ? ` ${selected.product.unit}` : ""}
              </span>
              {selected.product.stock != null ? (
                <span className="text-[#687386]">
                  主檔庫存 {Number(selected.product.stock)}
                </span>
              ) : null}
              {selected.product.price != null ? (
                <span className="text-[#687386]">NT$ {Number(selected.product.price)}</span>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E8EBF0]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F8FA] text-[11px] font-semibold uppercase tracking-wide text-[#8A94A6]">
                <tr>
                  <th className="px-3 py-2">分店</th>
                  <th className="px-3 py-2 text-right">庫存</th>
                  <th className="px-3 py-2 text-right">可供應</th>
                  {!compact ? <th className="hidden px-3 py-2 sm:table-cell">最近效期</th> : null}
                </tr>
              </thead>
              <tbody>
                {selected.stores.map((row) => (
                  <tr key={row.store_id} className="border-t border-[#E8EBF0]">
                    <td className="px-3 py-2.5 font-medium text-[#153E73]">
                      {row.store_name}
                      {row.batch_count > 0 ? (
                        <span className="mt-0.5 block text-[10px] font-normal text-[#8A94A6]">
                          {row.batch_count} 個批次
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#153E73]">
                      {row.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right text-base font-bold tabular-nums text-[#153E73]">
                      {row.available_quantity}
                    </td>
                    {!compact ? (
                      <td className="hidden px-3 py-2.5 text-[#687386] sm:table-cell">
                        {row.nearest_expiry || "—"}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/store/demand?type=restock&product_id=${selected.product.id}`}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              對此商品提分店需求
            </Link>
            {!compact ? (
              <Link
                href={`/admin/products/${selected.product.id}/edit`}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                開啟商品主檔
              </Link>
            ) : (
              <Link
                href="/admin/store/inventory"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                完整庫存查詢
              </Link>
            )}
          </div>
        </div>
      ) : !busy && q.trim() && products.length === 0 && !error ? (
        <p className="text-sm text-[#687386]">找不到相符商品。</p>
      ) : null}
    </div>
  );
}
