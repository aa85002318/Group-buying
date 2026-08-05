"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminBarcodeInput, type BarcodeProduct } from "@/components/admin/store/AdminBarcodeInput";
import { StoreManualProductAdd } from "@/components/admin/store/StoreManualProductAdd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STORE_REQUEST_STATUS_LABEL } from "@/lib/admin/store-entry";
import { cn } from "@/lib/utils";

type RequestKind = "out_of_stock" | "restock";

type StoreRequest = {
  id: string;
  request_kind?: string | null;
  product_label?: string | null;
  quantity?: number | null;
  note?: string | null;
  status?: string;
  requested_by_name?: string | null;
  created_at?: string;
  products?: { name?: string; sku?: string } | null;
};

function DemandInner() {
  const search = useSearchParams();
  const initial =
    search.get("type") === "out_of_stock" ? "out_of_stock" : "restock";
  const [kind, setKind] = useState<RequestKind>(initial as RequestKind);
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [list, setList] = useState<StoreRequest[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/admin/store/requests?kind=${encodeURIComponent(kind)}&status=pending`
    );
    const data = await res.json();
    setList(data.requests ?? []);
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = search.get("type");
    if (t === "out_of_stock" || t === "restock") setKind(t);
  }, [search]);

  const onProduct = (p: BarcodeProduct) => {
    setProductId(p.id);
    setProductName(p.name);
  };

  const submit = async () => {
    if (!productId) {
      setError("請先以條碼選擇或手動新增商品");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/store/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_kind: kind,
          product_id: productId,
          product_label: productName,
          quantity: kind === "out_of_stock" ? 1 : Number(quantity) || 1,
          note:
            note.trim() ||
            (kind === "out_of_stock" ? "商品缺貨通知" : "門市叫貨需求"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送出失敗");
      setMessage(kind === "out_of_stock" ? "缺貨通知已送出" : "叫貨需求已送出");
      setProductId(null);
      setProductName(null);
      setQuantity("1");
      setNote("");
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "送出失敗");
    } finally {
      setSaving(false);
    }
  };

  const review = async (id: string, status: "approved" | "rejected" | "fulfilled") => {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      const res = await fetch("/api/admin/store/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("更新失敗");
      void load();
    } catch {
      void load();
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#153E73]">分店商品需求／缺貨通知</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          以條碼選商品；無建檔可手動新增並寫入商品主檔。
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-[#F7F8FA] p-1">
        {(
          [
            { id: "out_of_stock" as const, label: "商品缺貨" },
            { id: "restock" as const, label: "門市商品叫貨需求" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setKind(t.id);
              setMessage(null);
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-lg px-2 py-2.5 text-sm font-bold transition",
              kind === t.id
                ? "bg-[#FFE149] text-[#153E73]"
                : "text-[#153E73]/70 hover:bg-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 rounded-[14px] border border-[#E7EAF0] bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-[#153E73]">
          {kind === "out_of_stock" ? "登記缺貨商品（條碼）" : "叫貨商品（條碼新增）"}
        </p>
        <AdminBarcodeInput onSelect={onProduct} autoFocus />
        {productName ? (
          <p className="text-sm text-[#153E73]">
            已選：
            <Link
              href={`/admin/products/${productId}/edit`}
              className="ml-1 font-semibold underline"
            >
              {productName}
            </Link>
          </p>
        ) : (
          <p className="text-xs text-amber-800">請掃描條碼，或手動新增商品</p>
        )}
        <StoreManualProductAdd onCreated={onProduct} />

        {kind === "restock" ? (
          <label className="block space-y-1 text-sm">
            <span className="font-semibold text-[#153E73]">數量</span>
            <Input
              type="number"
              min={1}
              className="h-11 rounded-xl"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
        ) : null}

        <label className="block space-y-1 text-sm">
          <span className="font-semibold text-[#153E73]">備註（選填）</span>
          <textarea
            className="min-h-[72px] w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={kind === "out_of_stock" ? "例如：客人詢問後登記缺貨" : "例如：週末備貨"}
          />
        </label>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}

        <Button
          type="button"
          disabled={saving}
          className="h-12 w-full border-[#FFE149] bg-[#FFE149] text-base font-bold text-[#153E73]"
          onClick={() => void submit()}
        >
          {saving ? "送出中…" : kind === "out_of_stock" ? "送出缺貨通知" : "送出叫貨需求"}
        </Button>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-[#153E73]">
          {kind === "out_of_stock" ? "待處理缺貨" : "待處理叫貨"}
        </h2>
        {list.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-4 text-sm text-muted-foreground">
            尚無待處理項目。
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((r) => {
              const name = r.products?.name || r.product_label || "未指定商品";
              const status = r.status ?? "pending";
              return (
                <li key={r.id} className="rounded-[12px] border border-[#E8EBF0] px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#153E73]">{name}</p>
                      <p className="mt-0.5 text-sm text-[#153E73]/80">
                        {kind === "restock" ? `數量 ${r.quantity ?? 1}` : "缺貨"}
                        {r.note ? ` · ${r.note}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {r.requested_by_name || "門市"} ·{" "}
                        {STORE_REQUEST_STATUS_LABEL[status] ?? status}
                      </p>
                    </div>
                    {status === "pending" ? (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800"
                          onClick={() => void review(r.id, "approved")}
                        >
                          同意
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800"
                          onClick={() => void review(r.id, "fulfilled")}
                        >
                          完成
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"
                          onClick={() => void review(r.id, "rejected")}
                        >
                          退回
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function StoreDemandPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">載入中…</p>}>
      <DemandInner />
    </Suspense>
  );
}
