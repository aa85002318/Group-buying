"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Minus, Plus, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminBarcodeInput,
  type BarcodeProduct,
} from "@/components/admin/store/AdminBarcodeInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  nextStatusInPipeline,
  requestStatusLabel,
  requestTypeLabel,
  statusPipelineForType,
  STORE_ASSIGNEE_OPTIONS,
  STORE_CUSTOMER_SOURCES,
  type StoreCustomerRequest,
  type StoreCustomerRequestStatus,
  type StoreCustomerRequestType,
  type StoreCustomerSource,
} from "@/lib/admin/store-pos-lite";
import { cn } from "@/lib/utils";

type ProductHit = BarcodeProduct & {
  brand?: string | null;
  price?: number | null;
};

type StoreOption = { id: string; name: string };
type Mode = "home" | "form";
type ListFilter = "all" | StoreCustomerRequestType;

export default function StoreCustomerServicePage() {
  const [mode, setMode] = useState<Mode>("home");
  const [tab, setTab] = useState<StoreCustomerRequestType>("order");
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [items, setItems] = useState<StoreCustomerRequest[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [source, setSource] = useState<StoreCustomerSource>("store");
  const [product, setProduct] = useState<ProductHit | null>(null);
  const [productQ, setProductQ] = useState("");
  const [productHits, setProductHits] = useState<ProductHit[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [inquiryBody, setInquiryBody] = useState("");
  const [needsReply, setNeedsReply] = useState(true);
  const [assignedToName, setAssignedToName] = useState("店長");
  const [expectedArrival, setExpectedArrival] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [pickupStoreId, setPickupStoreId] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/store/customer-requests");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setItems(data.items ?? []);
      setTodayCount(data.todayCount ?? (data.items ?? []).length);
      setStores((data.stores ?? []) as StoreOption[]);
    } catch {
      setItems([]);
      setTodayCount(0);
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("type");
    if (t === "order" || t === "price_inquiry") {
      setTab(t);
      setListFilter(t);
      setMode("form");
    }
    if (params.get("new") === "1") setMode("form");
  }, []);

  useEffect(() => {
    if (!productQ.trim()) {
      setProductHits([]);
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        const res = await fetch(
          `/api/admin/store/products?q=${encodeURIComponent(productQ.trim())}&limit=12`
        );
        const data = await res.json();
        setProductHits((data.products ?? []) as ProductHit[]);
      })();
    }, 250);
    return () => clearTimeout(timer);
  }, [productQ]);

  const stockQty = useMemo(() => {
    if (!product) return null;
    if (product.batch_qty != null) return Number(product.batch_qty);
    if (product.stock != null) return Number(product.stock);
    return null;
  }, [product]);

  const inStock = stockQty != null ? stockQty > 0 : null;

  const filteredItems = useMemo(() => {
    if (listFilter === "all") return items;
    return items.filter((item) => item.request_type === listFilter);
  }, [items, listFilter]);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "pending").length,
    [items]
  );

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setSource("store");
    setProduct(null);
    setProductQ("");
    setProductHits([]);
    setQty(1);
    setNote("");
    setInquiryBody("");
    setNeedsReply(true);
    setAssignedToName("店長");
    setExpectedArrival("");
    setFollowUpAt("");
    setPickupStoreId("");
    setInternalNote("");
    setDoneMsg(null);
  };

  const openForm = (type: StoreCustomerRequestType) => {
    resetForm();
    setTab(type);
    setMode("form");
  };

  const submit = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("請填寫客戶姓名與電話");
      return;
    }
    if (tab === "order" && !product) {
      alert("請選擇訂購商品（可掃條碼或搜尋）");
      return;
    }
    if (tab === "price_inquiry" && !inquiryBody.trim() && !product) {
      alert("請填寫詢問內容，或選擇要詢價的商品");
      return;
    }
    setSaving(true);
    setDoneMsg(null);
    try {
      const res = await fetch("/api/admin/store/customer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: tab,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_source: source,
          product_id: product?.id ?? null,
          barcode: product?.barcode ?? null,
          vendor_id: product?.supplier_id ?? null,
          quantity: qty,
          unit_price: product?.price ?? null,
          stock_snapshot: stockQty,
          in_stock: inStock,
          expected_arrival_date: tab === "order" ? expectedArrival || null : null,
          pickup_store_id: tab === "order" ? pickupStoreId || null : null,
          inquiry_body: tab === "price_inquiry" ? inquiryBody : null,
          needs_reply: tab === "price_inquiry" ? needsReply : false,
          note,
          internal_note: internalNote || null,
          assigned_to_name: assignedToName === "未指定" ? null : assignedToName,
          follow_up_at: tab === "price_inquiry" ? followUpAt || null : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "建立失敗");
      setDoneMsg(data.message ?? "已建立，狀態：待確認");
      await load();
      setTimeout(() => {
        resetForm();
        setMode("home");
      }, 700);
    } catch (e) {
      alert(e instanceof Error ? e.message : "建立失敗");
    } finally {
      setSaving(false);
    }
  };

  const patchStatus = async (id: string, status: StoreCustomerRequestStatus) => {
    const res = await fetch("/api/admin/store/customer-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "更新失敗");
      return;
    }
    setItems((list) => list.map((x) => (x.id === id ? { ...x, ...data.item } : x)));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <AdminPageHeader
        title="客戶服務"
        description="商品訂購與價格詢問。商品／廠商／規格自動帶入共用商品主檔，不建立電商訂單、不串接收銀。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => openForm("price_inquiry")}>
              ＋ 價格詢問
            </Button>
            <Button type="button" onClick={() => openForm("order")}>
              <Plus className="mr-1.5 h-4 w-4" />
              商品訂購
            </Button>
          </div>
        }
      />

      {mode === "home" ? (
        <>
          <section className="rounded-2xl border border-[#FFE149]/60 bg-[#FFFBEA] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#687386]">今日服務總覽</p>
                <p className="mt-1 text-3xl font-bold text-[#153E73]">
                  {loading ? "…" : todayCount}
                  <span className="ml-2 text-base font-semibold text-[#687386]">筆紀錄</span>
                </p>
                <p className="mt-1 text-sm text-[#687386]">
                  待確認 {pendingCount} 筆 · 狀態依流程推進，不扣庫存
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => openForm("order")}>
                  ＋ 商品訂購
                </Button>
                <Button type="button" variant="outline" onClick={() => openForm("price_inquiry")}>
                  ＋ 價格詢問
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[#153E73]">今日服務</h2>
              <div className="flex gap-1 rounded-full bg-[#F7F8FA] p-1">
                {(
                  [
                    ["all", "全部"],
                    ["order", "商品訂購"],
                    ["price_inquiry", "價格詢問"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setListFilter(id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm",
                      listFilter === id
                        ? "bg-[#FFE149] font-semibold text-[#153E73]"
                        : "text-[#687386]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-[#687386]">載入中…</p>
            ) : filteredItems.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#E6E9EF] bg-white p-8 text-center text-sm text-[#687386]">
                今天尚無服務紀錄
              </p>
            ) : (
              <ul className="space-y-3">
                {filteredItems.map((row) => {
                  const pipeline = statusPipelineForType(row.request_type);
                  const next = nextStatusInPipeline(row.request_type, row.status);
                  const brand = (() => {
                    const b = row.products?.brands;
                    return Array.isArray(b) ? b[0]?.name : b?.name;
                  })();
                  return (
                    <li
                      key={row.id}
                      className="rounded-2xl border border-[#E6E9EF] bg-white p-4 shadow-[0_4px_14px_rgba(21,62,115,0.04)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#FFF5CC] px-2.5 py-0.5 text-xs font-bold text-[#153E73]">
                              {requestTypeLabel(row.request_type)}
                            </span>
                            <span className="rounded-full border border-[#E6E9EF] px-2.5 py-0.5 text-xs font-semibold text-[#153E73]">
                              {requestStatusLabel(row.status, row.request_type)}
                            </span>
                          </div>
                          <p className="mt-2 text-base font-bold text-[#153E73]">
                            {row.customer_name}
                            <span className="ml-2 text-sm font-medium text-[#687386]">
                              {row.customer_phone}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-[#153E73]/85">
                            {row.products?.name ||
                              row.inquiry_body ||
                              row.note ||
                              "未指定商品"}
                            {brand ? ` · ${brand}` : ""}
                            {row.quantity != null ? ` · 數量 ${row.quantity}` : ""}
                          </p>
                          <p className="mt-1 text-[12px] text-[#8A94A6]">
                            {[
                              row.assigned_to_name ? `負責人 ${row.assigned_to_name}` : null,
                              row.pickup_store?.name
                                ? `取貨 ${row.pickup_store.name}`
                                : null,
                              row.expected_arrival_date
                                ? `希望到貨 ${row.expected_arrival_date}`
                                : null,
                              row.follow_up_at ? `預計回覆 ${row.follow_up_at}` : null,
                              row.needs_reply ? "需正式報價／回覆" : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "尚未指派"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {next ? (
                            <button
                              type="button"
                              onClick={() => void patchStatus(row.id, next)}
                              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[#FFE149] bg-[#FFE149] px-3 text-xs font-bold text-[#153E73]"
                            >
                              推進至 {requestStatusLabel(next, row.request_type)}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                          {row.status !== "cancelled" && row.status !== "done" ? (
                            <button
                              type="button"
                              onClick={() => void patchStatus(row.id, "cancelled")}
                              className="inline-flex min-h-9 items-center rounded-full border border-[#E6E9EF] px-3 text-xs font-semibold text-[#687386]"
                            >
                              取消
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {pipeline
                          .filter((s) => s.id !== "cancelled")
                          .map((step) => {
                            const activeIdx = pipeline.findIndex((s) => s.id === row.status);
                            const stepIdx = pipeline.findIndex((s) => s.id === step.id);
                            const reached = activeIdx >= stepIdx && row.status !== "cancelled";
                            return (
                              <button
                                key={step.id}
                                type="button"
                                onClick={() => void patchStatus(row.id, step.id)}
                                className={cn(
                                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                                  reached
                                    ? "bg-[#153E73] text-white"
                                    : "bg-[#F3F5F8] text-[#687386] hover:bg-[#FFF5CC]"
                                )}
                              >
                                {step.label}
                              </button>
                            );
                          })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : (
        <section className="space-y-4 rounded-2xl border border-[#E6E9EF] bg-white p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 rounded-full bg-[#F7F8FA] p-1">
              {(
                [
                  ["order", "商品訂購"],
                  ["price_inquiry", "價格詢問"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm",
                    tab === id
                      ? "bg-[#FFE149] font-semibold text-[#153E73]"
                      : "text-[#687386]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button type="button" variant="secondary" onClick={() => setMode("home")}>
              返回今日服務
            </Button>
          </div>

          <p className="text-sm text-[#687386]">
            {tab === "order"
              ? "流程：待確認 → 查詢中／待到貨 → 已通知 → 已完成"
              : "流程：待查價 → 已報價 → 已回覆 → 已完成"}
          </p>

          {doneMsg ? (
            <div className="flex items-center gap-2 rounded-xl bg-[#E8F5EE] px-3 py-2 text-sm text-[#2E7D5B]">
              <CheckCircle2 className="h-4 w-4" />
              {doneMsg}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">姓名 *</span>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">電話 *</span>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-[#153E73]">客戶來源</p>
            <div className="flex flex-wrap gap-2">
              {STORE_CUSTOMER_SOURCES.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
                    source === s.id
                      ? "border-[#FFE149] bg-[#FFF5CC] font-semibold text-[#153E73]"
                      : "border-[#E6E9EF] bg-white text-[#687386]"
                  )}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={source === s.id}
                    onChange={() => setSource(s.id)}
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          <AdminBarcodeInput
            autoFocus
            placeholder="掃描或輸入商品條碼"
            onSelect={(p) => {
              setProduct(p as ProductHit);
              setProductQ(p.name);
            }}
          />

          <div className="space-y-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">
                {tab === "order" ? "訂購商品 *" : "詢價商品（選填）"}
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
                <Input
                  className="pl-9"
                  value={productQ}
                  onChange={(e) => setProductQ(e.target.value)}
                  placeholder="搜尋品名／SKU／條碼"
                />
              </div>
            </label>
            {productHits.length > 0 ? (
              <ul className="max-h-48 overflow-auto rounded-xl border border-[#E6E9EF]">
                {productHits.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 border-b border-[#E6E9EF] px-3 py-2 text-left text-sm hover:bg-[#FFFBEA]"
                      onClick={() => {
                        setProduct(p);
                        setProductQ(p.name);
                        setProductHits([]);
                      }}
                    >
                      <span>
                        <span className="font-medium text-[#153E73]">{p.name}</span>
                        <span className="ml-2 text-xs text-[#687386]">
                          {p.brand || p.supplier_name || p.sku}
                        </span>
                      </span>
                      <span className="text-xs text-[#687386]">
                        {p.price != null ? `$${p.price}` : ""} · 庫存 {p.stock ?? "—"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {product ? (
            <div className="rounded-2xl border border-[#E6E9EF] bg-[#F7F8FA] p-4 text-sm">
              <p className="text-base font-bold text-[#153E73]">{product.name}</p>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                <p>廠商：{product.supplier_name || "—"}</p>
                <p>品牌：{product.brand || "—"}</p>
                <p>規格：{product.specifications || product.package_spec || product.unit || "—"}</p>
                <p>售價：{product.price != null ? `NT$ ${product.price}` : "—"}</p>
                <p>
                  目前庫存：{stockQty ?? "—"}{" "}
                  {inStock === true ? (
                    <span className="text-emerald-700">有庫存</span>
                  ) : inStock === false ? (
                    <span className="text-red-600">缺貨</span>
                  ) : null}
                </p>
                <p className="font-mono text-xs text-[#687386]">條碼 {product.barcode || "—"}</p>
              </div>
              <p className="mt-2">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="text-xs font-semibold text-[#153E73] underline"
                >
                  開啟商品主檔
                </Link>
              </p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="text-sm font-medium text-[#153E73]">
                {tab === "order" ? "數量 *" : "預估訂購量"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setQty((n) => Math.max(1, n - 1))}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Input
                  type="number"
                  className="w-24 text-center"
                  value={qty}
                  min={1}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                />
                <Button type="button" size="sm" variant="outline" onClick={() => setQty((n) => n + 1)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">
                {tab === "order" ? "負責人" : "指定回覆人員"}
              </span>
              <select
                className="w-full rounded-[10px] border border-[#E6E9EF] bg-white px-3 py-2"
                value={assignedToName}
                onChange={(e) => setAssignedToName(e.target.value)}
              >
                {STORE_ASSIGNEE_OPTIONS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {tab === "order" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-[#153E73]">希望到貨日期</span>
                <Input
                  type="date"
                  value={expectedArrival}
                  onChange={(e) => setExpectedArrival(e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-[#153E73]">指定取貨分店</span>
                <select
                  className="w-full rounded-[10px] border border-[#E6E9EF] bg-white px-3 py-2"
                  value={pickupStoreId}
                  onChange={(e) => setPickupStoreId(e.target.value)}
                >
                  <option value="">— 不指定 —</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-[#153E73]">詢問內容 *</span>
                <textarea
                  className="min-h-[100px] w-full rounded-[10px] border border-[#E6E9EF] px-3 py-2 text-sm"
                  placeholder={"例：是否有大量價格？\n預估需求約 100 包"}
                  value={inquiryBody}
                  onChange={(e) => setInquiryBody(e.target.value)}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border border-[#E6E9EF] px-3 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={needsReply}
                    onChange={(e) => setNeedsReply(e.target.checked)}
                  />
                  <span className="font-medium text-[#153E73]">是否需要正式報價</span>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-[#153E73]">預計回覆日期</span>
                  <Input
                    type="date"
                    value={followUpAt}
                    onChange={(e) => setFollowUpAt(e.target.value)}
                  />
                </label>
              </div>
            </>
          )}

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-[#153E73]">備註</span>
            <textarea
              className="min-h-[72px] w-full rounded-[10px] border border-[#E6E9EF] px-3 py-2 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-[#153E73]">內部備註（客戶不可見）</span>
            <Input value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setMode("home")}>
              取消
            </Button>
            <Button type="button" disabled={saving} onClick={() => void submit()}>
              {saving ? "送出中…" : "送出（狀態：待確認）"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
