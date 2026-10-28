"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { BarcodeScanner } from "@/components/admin/store/BarcodeScanner";
import { Button } from "@/components/ui/button";

/**
 * 手機掃碼盤點。
 *
 * 流程：選門市 → 開盤點單 → 掃條碼 → 輸入實際數量 → 繼續掃 → 全部點完按套用。
 *
 * 幾個刻意的設計：
 * - 盤點是「設定為」不是「累加」。同一個商品重複掃會跳回那一筆讓你改，
 *   不會自己加一。架上數量是數出來的，不是掃幾次算幾個。
 * - 每次改動都即時存回盤點單。門市訊號不穩、手機被鎖屏、App 被切掉都不怕，
 *   回來接著做就好。
 * - 掃到系統沒有的條碼不會中斷流程，先收進待處理，繼續掃下一個。
 */

type Store = { id: string; name: string };

type ScanLine = {
  product_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  image_url: string | null;
  unit: string | null;
  system_qty: number;
  counted_qty: number | null;
};

type Props = { stores: Store[]; defaultStoreId: string | null };

export function StocktakeScanClient({ stores, defaultStoreId }: Props) {
  const [storeId, setStoreId] = useState(defaultStoreId ?? stores[0]?.id ?? "");
  const [stocktakeId, setStocktakeId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [lines, setLines] = useState<ScanLine[]>([]);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unknownCount, setUnknownCount] = useState(0);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<null | { applied: number; skipped: number }>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const activeRef = useRef<string | null>(null);

  const storeName = useMemo(
    () => stores.find((s) => s.id === storeId)?.name ?? "",
    [stores, storeId]
  );

  const countedTotal = lines.filter((l) => l.counted_qty != null).length;

  /** 建立或接續一張盤點單。 */
  const startStocktake = useCallback(async () => {
    if (!storeId) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/stocktakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          title: `手機盤點 ${new Date().toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "無法建立盤點單");
      setStocktakeId(data.stocktake.id);
      setLines([]);
      setApplied(null);
      setNotice("盤點單已建立，可以開始掃了。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "無法建立盤點單");
    } finally {
      setStarting(false);
    }
  }, [storeId]);

  /** 把一筆數量存回盤點單。改一次存一次，不等最後。 */
  const persistLine = useCallback(
    async (productId: string, qty: number | null) => {
      if (!stocktakeId) return;
      setSavingIds((prev) => new Set(prev).add(productId));
      try {
        await fetch(`/api/admin/store/stocktakes/${stocktakeId}/lines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines: [{ product_id: productId, counted_qty: qty }] }),
        });
      } catch {
        setError("這一筆沒存起來，請確認網路後再改一次數量。");
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    },
    [stocktakeId]
  );

  const handleScan = useCallback(
    async (barcode: string) => {
      if (!stocktakeId || lookupBusy) return;
      setError(null);

      // 已經在清單裡：跳到那一筆，不重複查也不自動加一。
      const existing = lines.find((l) => l.barcode === barcode);
      if (existing) {
        activeRef.current = existing.product_id;
        setNotice(`${existing.name}　已在清單中，請直接修改數量`);
        document
          .getElementById(`line-${existing.product_id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      setLookupBusy(true);
      try {
        const res = await fetch(
          `/api/admin/store/barcode?q=${encodeURIComponent(barcode)}&store_id=${encodeURIComponent(storeId)}`
        );
        const data = await res.json();

        if (!res.ok || !data.product) {
          // 查不到不要卡住流程，先收起來繼續掃。
          await fetch("/api/admin/store/unknown-barcodes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ barcode, store_id: storeId }),
          }).catch(() => {});
          setUnknownCount((n) => n + 1);
          setNotice(`條碼 ${barcode} 找不到對應商品，已記下來，可以繼續掃。`);
          return;
        }

        const p = data.product;
        const line: ScanLine = {
          product_id: String(p.id),
          name: String(p.name ?? ""),
          sku: p.sku ?? null,
          barcode: p.barcode ?? barcode,
          image_url: p.image_url ?? null,
          unit: p.unit ?? null,
          // store_qty 是這間門市的量；真的拿不到才退回商品主檔的總庫存。
          system_qty: Number(p.store_qty ?? p.stock ?? 0),
          counted_qty: null,
        };
        setLines((prev) => [line, ...prev]);
        activeRef.current = line.product_id;
        setNotice(`${line.name}　請輸入實際數量`);
      } catch {
        setError("查詢商品失敗，請確認網路。");
      } finally {
        setLookupBusy(false);
      }
    },
    [stocktakeId, lines, lookupBusy, storeId]
  );

  const setQty = useCallback(
    (productId: string, qty: number | null) => {
      setLines((prev) =>
        prev.map((l) => (l.product_id === productId ? { ...l, counted_qty: qty } : l))
      );
      void persistLine(productId, qty);
    },
    [persistLine]
  );

  const removeLine = useCallback(
    (productId: string) => {
      // counted_qty 設回 null = 這一筆不算數，套用時會跳過。
      setLines((prev) => prev.filter((l) => l.product_id !== productId));
      void persistLine(productId, null);
    },
    [persistLine]
  );

  const applyAll = useCallback(async () => {
    if (!stocktakeId) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/store/stocktakes/${stocktakeId}/apply`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "套用失敗");
      setApplied({ applied: data.result.applied, skipped: data.result.skipped });
      setNotice(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "套用失敗");
    } finally {
      setApplying(false);
    }
  }, [stocktakeId]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  // ── 套用完成 ──────────────────────────────────────────────
  if (applied) {
    return (
      <div className="space-y-4 p-4">
        <div className="rounded-2xl bg-[#E8F8EF] p-5 text-center">
          <Check className="mx-auto h-10 w-10 text-[#1B6B3A]" />
          <p className="mt-2 text-lg font-bold text-[#1B6B3A]">盤點已套用</p>
          <p className="mt-1 text-sm text-[#1B6B3A]/80">
            更新 {applied.applied} 項
            {applied.skipped ? `，略過 ${applied.skipped} 項（沒輸入數量）` : ""}
          </p>
        </div>
        <Link href="/admin/store/shortages" className="block">
          <Button className="w-full">看缺貨清單</Button>
        </Link>
        <Button variant="secondary" className="w-full" onClick={() => setApplied(null)}>
          再盤一次
        </Button>
      </div>
    );
  }

  // ── 還沒開單 ──────────────────────────────────────────────
  if (!stocktakeId) {
    return (
      <div className="space-y-4 p-4">
        <div className="card-surface space-y-3 p-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[#153E73]">盤哪一間門市</span>
            <select
              className="input-field h-11 w-full"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[12px] text-[#8A94A6]">
            盤點會把這間門市的庫存改成你實際數到的數量，並同步更新網站上的庫存。
          </p>
          <Button className="w-full" disabled={!storeId || starting} onClick={startStocktake}>
            {starting ? "建立中…" : "開始盤點"}
          </Button>
        </div>
        {error ? (
          <p className="rounded-xl bg-error-soft px-3 py-2 text-sm text-error">{error}</p>
        ) : null}
      </div>
    );
  }

  // ── 盤點中 ────────────────────────────────────────────────
  return (
    <div className="space-y-3 p-4 pb-32">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#153E73]">{storeName}</p>
        <p className="text-[12px] text-[#8A94A6]">已點 {countedTotal} 項</p>
      </div>

      <BarcodeScanner onScan={handleScan} paused={lookupBusy} />

      {notice ? (
        <p className="rounded-xl bg-[#FFF7E0] px-3 py-2 text-[13px] text-[#8A6A00]">{notice}</p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-error-soft px-3 py-2 text-[13px] text-error">{error}</p>
      ) : null}

      {unknownCount > 0 ? (
        <Link
          href="/admin/store/unknown-barcodes"
          className="flex items-center gap-2 rounded-xl bg-[#FDE8E6] px-3 py-2 text-[13px] text-[#B42318]"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          有 {unknownCount} 個條碼找不到商品，稍後處理
        </Link>
      ) : null}

      {lines.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#8A94A6]">
          對準商品條碼，掃到就會出現在這裡。
        </p>
      ) : (
        <ul className="space-y-2">
          {lines.map((l) => {
            const diff = l.counted_qty == null ? null : l.counted_qty - l.system_qty;
            return (
              <li
                key={l.product_id}
                id={`line-${l.product_id}`}
                className="card-surface space-y-2 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{l.name}</p>
                    <p className="text-[11px] text-[#8A94A6]">
                      系統 {l.system_qty}
                      {l.unit ? ` ${l.unit}` : ""}
                      {l.sku ? `・${l.sku}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(l.product_id)}
                    className="shrink-0 rounded-lg p-2 text-[#8A94A6]"
                    aria-label="移除這一筆"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-11 w-11 shrink-0 rounded-xl bg-[#F1F3F7] text-[#153E73]"
                    onClick={() => setQty(l.product_id, Math.max(0, (l.counted_qty ?? 0) - 1))}
                    aria-label="減一"
                  >
                    <Minus className="mx-auto h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    data-stocktake-qty="true"
                    value={l.counted_qty ?? ""}
                    placeholder="實際數量"
                    onChange={(e) => {
                      const v = e.target.value;
                      setQty(l.product_id, v === "" ? null : Math.max(0, Number(v)));
                    }}
                    className="input-field h-11 flex-1 text-center text-lg font-bold"
                  />
                  <button
                    type="button"
                    className="h-11 w-11 shrink-0 rounded-xl bg-[#F1F3F7] text-[#153E73]"
                    onClick={() => setQty(l.product_id, (l.counted_qty ?? 0) + 1)}
                    aria-label="加一"
                  >
                    <Plus className="mx-auto h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className={diff == null ? "text-[#8A94A6]" : diff === 0 ? "text-[#1B6B3A]" : "text-[#B42318]"}>
                    {diff == null
                      ? "尚未輸入"
                      : diff === 0
                        ? "與系統相符"
                        : diff > 0
                          ? `盤盈 +${diff}`
                          : `盤虧 ${diff}`}
                  </span>
                  {savingIds.has(l.product_id) ? (
                    <span className="flex items-center gap-1 text-[#8A94A6]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      儲存中
                    </span>
                  ) : l.counted_qty != null ? (
                    <span className="text-[#8A94A6]">已儲存</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-[#E7EAF0] bg-white p-3">
        <Button
          className="w-full"
          disabled={countedTotal === 0 || applying}
          onClick={applyAll}
        >
          {applying ? "套用中…" : `套用盤點（${countedTotal} 項）`}
        </Button>
        <p className="mt-1 text-center text-[11px] text-[#8A94A6]">
          套用後庫存就會改變，並留下異動紀錄
        </p>
      </div>
    </div>
  );
}
