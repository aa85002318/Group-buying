"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Package } from "lucide-react";
import { AdminBarcodeInput, type BarcodeProduct } from "@/components/admin/store/AdminBarcodeInput";
import { StoreManualProductAdd } from "@/components/admin/store/StoreManualProductAdd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  nextDemandStatus,
  STORE_DEMAND_STATUS_PIPELINE,
  STORE_REQUEST_STATUS_LABEL,
} from "@/lib/admin/store-entry";
import { cn } from "@/lib/utils";

type RequestKind = "out_of_stock" | "restock";

type StoreOption = { id: string; name: string };

type StoreRequest = {
  id: string;
  request_kind?: string | null;
  product_label?: string | null;
  quantity?: number | null;
  note?: string | null;
  status?: string;
  requested_by_name?: string | null;
  created_at?: string;
  source_store_id?: string | null;
  reply_quantity?: number | null;
  reply_note?: string | null;
  review_note?: string | null;
  products?: {
    name?: string;
    sku?: string;
    barcode?: string | null;
    stock?: number | null;
    supplier_name?: string | null;
    price?: number | null;
  } | null;
  source_store?: { id?: string; name?: string } | null;
  stores?: { id?: string; name?: string } | null;
};

function formatTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DemandInner() {
  const search = useSearchParams();
  const initial =
    search.get("type") === "out_of_stock" ? "out_of_stock" : "restock";
  const [kind, setKind] = useState<RequestKind>(initial);
  const [mode, setMode] = useState<"list" | "create">("list");
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [productMeta, setProductMeta] = useState<BarcodeProduct | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [sourceStoreId, setSourceStoreId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [list, setList] = useState<StoreRequest[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<"open" | "pending" | "all">("open");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("kind", kind);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/admin/store/requests?${params}`);
    const data = await res.json();
    setList(data.requests ?? []);
    setStores(data.stores ?? []);
  }, [kind, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = search.get("type");
    if (t === "out_of_stock" || t === "restock") setKind(t);
    if (search.get("new") === "1") setMode("create");
  }, [search]);

  const pendingCount = useMemo(
    () => list.filter((r) => (r.status ?? "pending") === "pending").length,
    [list]
  );

  const onProduct = (p: BarcodeProduct) => {
    setProductId(p.id);
    setProductName(p.name);
    setProductMeta(p);
  };

  const resetCreate = () => {
    setProductId(null);
    setProductName(null);
    setProductMeta(null);
    setQuantity("1");
    setSourceStoreId("");
    setNote("");
    setError(null);
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
          source_store_id: kind === "restock" ? sourceStoreId || null : null,
          note:
            note.trim() ||
            (kind === "out_of_stock" ? "商品缺貨通知" : "分店貨品需求"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送出失敗");
      setMessage(data.message ?? "需求已送出（待確認）");
      resetCreate();
      setMode("list");
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "送出失敗");
    } finally {
      setSaving(false);
    }
  };

  const review = async (
    id: string,
    status: string,
    extras?: { reply_quantity?: number; reply_note?: string }
  ) => {
    setList((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              reply_quantity: extras?.reply_quantity ?? r.reply_quantity,
              reply_note: extras?.reply_note ?? r.reply_note,
            }
          : r
      )
    );
    try {
      const res = await fetch("/api/admin/store/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          reply_quantity: extras?.reply_quantity,
          reply_note: extras?.reply_note || replyDrafts[id] || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新失敗");
      setMessage(data.message ?? "已更新回覆狀態");
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失敗");
      void load();
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#153E73]">分店協作</h1>
          <p className="mt-1 text-sm text-[#687386]">
            分店貨品需求與缺貨通知。回覆僅更新狀態，不會直接修改其他分店庫存。
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            resetCreate();
            setMode("create");
            setMessage(null);
          }}
        >
          ＋ 提出需求
        </Button>
      </div>

      <div className="flex gap-1 rounded-xl bg-[#F7F8FA] p-1">
        {(
          [
            { id: "restock" as const, label: "分店貨品需求" },
            { id: "out_of_stock" as const, label: "缺貨通知" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setKind(t.id);
              setMessage(null);
              setError(null);
              setMode("list");
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

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {mode === "create" ? (
        <div className="space-y-3 rounded-2xl border border-[#E7EAF0] bg-white p-4 shadow-sm md:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-bold text-[#153E73]">
              {kind === "out_of_stock" ? "新增缺貨通知" : "新增分店貨品需求"}
            </p>
            <Button type="button" variant="secondary" onClick={() => setMode("list")}>
              返回列表
            </Button>
          </div>

          <p className="text-sm text-[#687386]">
            流程：提出需求 → 指定來源門市 → 回覆可供應／部分／無法 → 安排交接 → 確認交接 → 完成
          </p>

          <AdminBarcodeInput onSelect={onProduct} autoFocus />
          {productName ? (
            <div className="rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] p-3 text-sm">
              <p className="font-semibold text-[#153E73]">
                已選：
                <Link
                  href={`/admin/products/${productId}/edit`}
                  className="ml-1 underline"
                >
                  {productName}
                </Link>
              </p>
              <div className="mt-1 grid gap-1 text-[#687386] sm:grid-cols-2">
                <p>廠商：{productMeta?.supplier_name || "—"}</p>
                <p>目前庫存：{productMeta?.stock ?? "—"}</p>
                <p>SKU：{productMeta?.sku || "—"}</p>
                <p>條碼：{productMeta?.barcode || "—"}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-800">請掃描條碼，或手動新增商品</p>
          )}
          <StoreManualProductAdd onCreated={onProduct} />

          {kind === "restock" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-semibold text-[#153E73]">需求數量 *</span>
                <Input
                  type="number"
                  min={1}
                  className="h-11 rounded-xl"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-semibold text-[#153E73]">希望來源門市</span>
                <select
                  className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
                  value={sourceStoreId}
                  onChange={(e) => setSourceStoreId(e.target.value)}
                >
                  <option value="">— 不指定（全部分店可見）—</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          <label className="block space-y-1 text-sm">
            <span className="font-semibold text-[#153E73]">備註（選填）</span>
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                kind === "out_of_stock"
                  ? "例如：客人詢問後登記缺貨"
                  : "例如：週末備貨，希望信義店支援"
              }
            />
          </label>

          <Button
            type="button"
            disabled={saving}
            className="h-12 w-full border-[#FFE149] bg-[#FFE149] text-base font-bold text-[#153E73]"
            onClick={() => void submit()}
          >
            {saving ? "送出中…" : "送出（狀態：待確認）"}
          </Button>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-[#FFE149]/50 bg-[#FFFBEA] px-4 py-3">
            <p className="text-sm font-semibold text-[#153E73]">
              待確認 {pendingCount} 筆 · 開啟中 {list.length} 筆
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(
                [
                  ["open", "進行中"],
                  ["pending", "僅待確認"],
                  ["all", "全部"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStatusFilter(id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    statusFilter === id
                      ? "bg-[#FFE149] text-[#153E73]"
                      : "bg-white text-[#687386]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            {list.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-8 text-center text-sm text-[#687386]">
                尚無{kind === "out_of_stock" ? "缺貨通知" : "分店需求"}。
              </p>
            ) : (
              list.map((r) => {
                const name = r.products?.name || r.product_label || "未指定商品";
                const status = r.status ?? "pending";
                const next = nextDemandStatus(status);
                const replyQty = replyDrafts[r.id] ?? String(r.reply_quantity ?? r.quantity ?? 1);
                return (
                  <article
                    key={r.id}
                    className="rounded-2xl border border-[#E8EBF0] bg-white p-4 shadow-[0_4px_14px_rgba(21,62,115,0.04)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF5CC] px-2.5 py-0.5 text-xs font-bold text-[#153E73]">
                            <Package className="h-3.5 w-3.5" />
                            {kind === "restock" ? "分店需求" : "缺貨通知"}
                          </span>
                          <span className="rounded-full border border-[#E6E9EF] px-2.5 py-0.5 text-xs font-semibold text-[#153E73]">
                            {STORE_REQUEST_STATUS_LABEL[status] ?? status}
                          </span>
                        </div>
                        <p className="mt-2 text-base font-bold text-[#153E73]">{name}</p>
                        <p className="mt-1 text-sm text-[#687386]">
                          需求數量 {r.quantity ?? 1}
                          {r.reply_quantity != null ? ` · 可供應 ${r.reply_quantity}` : ""}
                          {r.products?.stock != null ? ` · 目前庫存 ${r.products.stock}` : ""}
                        </p>
                        <p className="mt-1 text-[12px] text-[#8A94A6]">
                          {[
                            r.requested_by_name || "門市",
                            r.stores?.name ? `需求店 ${r.stores.name}` : null,
                            r.source_store?.name ? `希望來源 ${r.source_store.name}` : null,
                            formatTime(r.created_at),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {r.note ? (
                          <p className="mt-1 text-sm text-[#153E73]/80">{r.note}</p>
                        ) : null}
                        {r.reply_note || r.review_note ? (
                          <p className="mt-1 text-sm text-[#687386]">
                            回覆：{r.reply_note || r.review_note}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2">
                        {status === "pending" ? (
                          <>
                            <button
                              type="button"
                              className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800"
                              onClick={() =>
                                void review(r.id, "approved", {
                                  reply_quantity: Number(r.quantity ?? 1),
                                })
                              }
                            >
                              可供應
                            </button>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={1}
                                className="h-8 w-20 rounded-lg text-xs"
                                value={replyQty}
                                onChange={(e) =>
                                  setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))
                                }
                              />
                              <button
                                type="button"
                                className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800"
                                onClick={() =>
                                  void review(r.id, "partial", {
                                    reply_quantity: Number(replyQty) || 1,
                                  })
                                }
                              >
                                部分供應
                              </button>
                            </div>
                            <button
                              type="button"
                              className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700"
                              onClick={() => void review(r.id, "rejected")}
                            >
                              無法供應
                            </button>
                          </>
                        ) : next ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-[#FFE149] bg-[#FFE149] px-3 py-1.5 text-xs font-bold text-[#153E73]"
                            onClick={() => void review(r.id, next)}
                          >
                            推進至 {STORE_REQUEST_STATUS_LABEL[next] ?? next}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {kind === "restock" ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {STORE_DEMAND_STATUS_PIPELINE.map((step) => {
                          const order = [
                            "pending",
                            "approved",
                            "partial",
                            "arranged",
                            "handed_over",
                            "fulfilled",
                          ];
                          const currentIdx = order.indexOf(status === "rejected" ? "pending" : status);
                          const stepIdx = order.indexOf(step.id);
                          const reached =
                            status !== "rejected" &&
                            status !== "cancelled" &&
                            stepIdx >= 0 &&
                            currentIdx >= stepIdx &&
                            !(step.id === "approved" && status === "partial") &&
                            !(step.id === "partial" && status === "approved" && currentIdx > 1);
                          const highlight =
                            step.id === status ||
                            (status === "partial" && step.id === "partial") ||
                            (status === "approved" && step.id === "approved");
                          return (
                            <button
                              key={step.id}
                              type="button"
                              onClick={() => {
                                if (step.id === "partial") {
                                  void review(r.id, "partial", {
                                    reply_quantity: Number(replyQty) || Number(r.quantity ?? 1),
                                  });
                                  return;
                                }
                                void review(r.id, step.id);
                              }}
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                highlight
                                  ? "bg-[#153E73] text-white"
                                  : reached
                                    ? "bg-[#FFF5CC] text-[#153E73]"
                                    : "bg-[#F3F5F8] text-[#687386]"
                              )}
                            >
                              {step.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    <label className="mt-3 block text-xs text-[#687386]">
                      回覆說明
                      <Input
                        className="mt-1 h-9 rounded-lg"
                        placeholder="例如：可供應 6 包，週三門市交接"
                        value={replyDrafts[r.id] ?? ""}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))
                        }
                      />
                    </label>
                  </article>
                );
              })
            )}
          </section>
        </>
      )}
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
