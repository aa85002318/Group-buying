"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BatchRow = {
  id: string;
  product_id: string;
  batch_no: string;
  remaining_quantity?: number | null;
  quantity?: number | null;
  location?: string | null;
  status?: string | null;
  products?: { name?: string; sku?: string; barcode?: string; unit?: string | null } | null;
};

type AggregateRow = {
  product_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  unit?: string | null;
  total: number;
  batches: BatchRow[];
};

/** Inventory = sum of active batch remaining quantities (not an independent stock source). */
export default function StoreInventoryPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/batches?status=active");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setBatches(data.batches ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const map = new Map<string, AggregateRow>();
    for (const b of batches) {
      const remaining = Number(b.remaining_quantity ?? b.quantity ?? 0);
      const existing = map.get(b.product_id);
      if (!existing) {
        map.set(b.product_id, {
          product_id: b.product_id,
          name: b.products?.name ?? "—",
          sku: b.products?.sku,
          barcode: b.products?.barcode,
          unit: b.products?.unit,
          total: remaining,
          batches: [b],
        });
      } else {
        existing.total += remaining;
        existing.batches.push(b);
      }
    }
    let list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(needle) ||
          r.sku?.toLowerCase().includes(needle) ||
          r.barcode?.toLowerCase().includes(needle)
      );
    }
    return list;
  }, [batches, q]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="庫存管理"
        description="庫存為各批次剩餘量彙總視圖，不是獨立庫存來源。進貨請至批次管理。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/store/batches?receive=1">
              <Button>快速進貨</Button>
            </Link>
            <Link href="/admin/products">
              <Button variant="secondary">商品主檔</Button>
            </Link>
          </div>
        }
      />

      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋商品"
          className="max-w-xs rounded-[10px]"
        />
        <Button type="button" variant="outline" onClick={() => void load()}>
          重新整理
        </Button>
      </div>

      {error ? <p className="text-sm text-[#C94C4C]">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-[#756B64]">載入中…</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.product_id} className="rounded-[16px] border border-[#E9DED4] bg-white">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                onClick={() => setExpanded((v) => (v === r.product_id ? null : r.product_id))}
              >
                <div>
                  <Link
                    href={`/admin/products/${r.product_id}/edit`}
                    className="font-semibold text-[#2F2925] hover:text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {r.name}
                  </Link>
                  <p className="text-xs text-[#756B64]">
                    {r.batches.length} 個批次 · {r.barcode ?? r.sku ?? ""}
                  </p>
                </div>
                <p className="text-lg font-bold text-[#2F2925]">
                  {r.total}
                  {r.unit ? ` ${r.unit}` : ""}
                </p>
              </button>
              {expanded === r.product_id ? (
                <ul className="space-y-1 border-t border-[#E9DED4] px-4 py-3 text-sm">
                  {r.batches.map((b) => (
                    <li key={b.id} className="flex justify-between gap-2">
                      <Link
                        href={`/admin/store/batches/${b.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {b.batch_no}
                        {b.location ? ` · ${b.location}` : ""}
                      </Link>
                      <span>{Number(b.remaining_quantity ?? b.quantity ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          {!rows.length ? (
            <p className="rounded-[16px] border border-[#E9DED4] bg-white p-8 text-center text-sm text-[#756B64]">
              尚無批次庫存。請先快速進貨建立批次。
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
