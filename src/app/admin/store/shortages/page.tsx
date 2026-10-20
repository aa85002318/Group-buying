"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, PackageX, Send } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";

/**
 * 上架中但門市沒貨的商品清單。
 *
 * 盤點完之後一眼看出哪些商品網站上還在賣、架上卻空了，
 * 可以直接送進「門市協作區」的缺貨通知，讓其他門市和總部看得到近況。
 */

type Shortage = {
  product_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  image_url: string | null;
  unit: string | null;
  quantity: number;
  threshold: number;
  counted_at: string | null;
  never_counted: boolean;
  never_stocked: boolean;
};

export default function StoreShortagesPage() {
  const [items, setItems] = useState<Shortage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyCounted, setOnlyCounted] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (onlyCounted) params.set("only_counted", "1");
      const res = await fetch(`/api/admin/store/shortages?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setItems((data.shortages ?? []) as Shortage[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [onlyCounted]);

  useEffect(() => {
    void load();
  }, [load]);

  /** 送一則缺貨通知到門市協作區。 */
  const notify = async (item: Shortage) => {
    setSending(item.product_id);
    try {
      const res = await fetch("/api/admin/store/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 欄位名稱依 /api/admin/store/requests 的既有介面：request_kind / note。
        body: JSON.stringify({
          request_kind: "out_of_stock",
          product_id: item.product_id,
          product_name: item.name,
          quantity: 1,
          note: `盤點後庫存 ${item.quantity}${item.unit ?? ""}，低於門檻 ${item.threshold}。`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "送出失敗");
      }
      setSent((prev) => new Set(prev).add(item.product_id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "送出失敗");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AdminPageHeader
        title="缺貨清單"
        description="上架中、但這間門市庫存為 0 或低於安全量的商品。可以直接送進門市協作區的缺貨通知。"
        actions={
          <Link href="/admin/store/stocktake/scan">
            <Button variant="secondary">去盤點</Button>
          </Link>
        }
      />

      <div className="space-y-3 p-4">
        <label className="flex items-center gap-2 text-[13px] text-[#153E73]">
          <input
            type="checkbox"
            checked={onlyCounted}
            onChange={(e) => setOnlyCounted(e.target.checked)}
          />
          只看盤點過的商品
        </label>
        <p className="text-[12px] text-[#8A94A6]">
          沒盤點過的商品，系統裡的數字不一定反映架上實際狀況（POS 沒有連動，賣出不會自動扣）。
          建議先盤過再看這份清單。
        </p>

        {error ? (
          <p className="rounded-xl bg-error-soft px-3 py-2 text-sm text-error">{error}</p>
        ) : null}

        {loading ? (
          <p className="py-10 text-center text-sm text-[#8A94A6]">載入中…</p>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <PackageX className="mx-auto h-8 w-8 text-[#8A94A6]" />
            <p className="mt-2 text-sm text-[#8A94A6]">
              {onlyCounted ? "盤點過的商品都還有貨。" : "沒有缺貨的商品。"}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.product_id} className="card-surface flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                  <p className="text-[11px] text-[#8A94A6]">
                    庫存 {item.quantity}
                    {item.unit ?? ""}　門檻 {item.threshold}
                    {item.sku ? `　${item.sku}` : ""}
                  </p>
                  {item.never_counted ? (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#B42318]">
                      <AlertTriangle className="h-3 w-3" />
                      尚未盤點過，數字僅供參考
                    </p>
                  ) : null}
                </div>
                {sent.has(item.product_id) ? (
                  <span className="shrink-0 text-[12px] font-bold text-[#1B6B3A]">已通知</span>
                ) : (
                  <button
                    type="button"
                    disabled={sending === item.product_id}
                    onClick={() => notify(item)}
                    className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#153E73] px-3 text-[13px] font-bold text-white disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sending === item.product_id ? "送出中…" : "通知缺貨"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/admin/store/demand"
          className="block rounded-xl bg-[#F1F3F7] px-4 py-3 text-center text-[13px] font-bold text-[#153E73]"
        >
          到門市協作區看缺貨處理進度
        </Link>
      </div>
    </div>
  );
}
