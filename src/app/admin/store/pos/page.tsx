"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Minus, Plus, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminBarcodeInput,
  type BarcodeProduct,
} from "@/components/admin/store/AdminBarcodeInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  requestStatusLabel,
  requestTypeLabel,
  STORE_CUSTOMER_SOURCES,
  STORE_CUSTOMER_STATUSES,
  type StoreCustomerRequest,
  type StoreCustomerRequestType,
  type StoreCustomerSource,
} from "@/lib/admin/store-pos-lite";
import { cn } from "@/lib/utils";

type ProductHit = BarcodeProduct & {
  brand?: string | null;
  price?: number | null;
};

type Mode = "home" | "form";

export default function StorePosLitePage() {
  const [mode, setMode] = useState<Mode>("home");
  const [tab, setTab] = useState<StoreCustomerRequestType>("order");
  const [items, setItems] = useState<StoreCustomerRequest[]>([]);
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
  const [assignedToName, setAssignedToName] = useState("業務");
  const [expectedArrival, setExpectedArrival] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/store/customer-requests");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setItems(data.items ?? []);
      setTodayCount(data.todayCount ?? (data.items ?? []).length);
    } catch {
      setItems([]);
      setTodayCount(0);
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
      setMode("form");
    }
    if (params.get("new") === "1") setMode("form");
  }, []);

  useEffect(() => {
    if (!productQ.trim()) {
      setProductHits([]);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        const res = await fetch(
          `/api/admin/store/products?q=${encodeURIComponent(productQ.trim())}&limit=12`
        );
        const data = await res.json();
        setProductHits((data.products ?? []) as ProductHit[]);
      })();
    }, 250);
    return () => clearTimeout(t);
  }, [productQ]);

  const stockQty = useMemo(() => {
    if (!product) return null;
    if (product.batch_qty != null) return Number(product.batch_qty);
    if (product.stock != null) return Number(product.stock);
    return null;
  }, [product]);

  const inStock = stockQty != null ? stockQty > 0 : null;

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
    setAssignedToName("業務");
    setExpectedArrival("");
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
      alert("請選擇商品（可掃條碼或搜尋）");
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
          quantity: tab === "order" ? qty : null,
          unit_price: product?.price ?? null,
          stock_snapshot: stockQty,
          in_stock: inStock,
          expected_arrival_date: expectedArrival || null,
          inquiry_body: tab === "price_inquiry" ? inquiryBody : null,
          needs_reply: tab === "price_inquiry" ? needsReply : false,
          note,
          internal_note: internalNote || null,
          assigned_to_name: tab === "price_inquiry" ? assignedToName : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "建立失敗");
      setDoneMsg(data.message ?? "已建立");
      await load();
      setTimeout(() => {
        resetForm();
        setMode("home");
      }, 800);
    } catch (e) {
      alert(e instanceof Error ? e.message : "建立失敗");
    } finally {
      setSaving(false);
    }
  };

  const patchTrack = async (
    id: string,
    patch: Partial<
      Pick<
        StoreCustomerRequest,
        "track_notified" | "track_paid" | "track_picked_up" | "track_done" | "status"
      >
    >
  ) => {
    const res = await fetch("/api/admin/store/customer-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "更新失敗");
      return;
    }
    setItems((list) => list.map((x) => (x.id === id ? { ...x, ...data.item } : x)));
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="現場客戶服務"
        description="POS Lite：快速記錄門市客戶訂購與價格詢問。商品來自共用 products，不建立完整電商訂單。"
        actions={
          <Button type="button" onClick={() => openForm(tab)}>
            <Plus className="mr-1.5 h-4 w-4" />
            新增服務紀錄
          </Button>
        }
      />

      {mode === "home" ? (
        <>
          <section className="rounded-[20px] border border-[#E9DED4] bg-gradient-to-br from-[#FFF8F5] to-white p-5">
            <p className="text-sm text-[#756B64]">👋 現場客戶服務</p>
            <p className="mt-2 text-3xl font-black text-[#2F2925]">
              今天已接待{" "}
              <span className="text-[#C45C26]">{loading ? "…" : todayCount}</span> 位
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={() => openForm("order")}>
                ＋ 商品訂購
              </Button>
              <Button type="button" variant="outline" onClick={() => openForm("price_inquiry")}>
                ＋ 價格詢問
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#2F2925]">今日服務</h2>
            {loading ? (
              <p className="text-sm text-[#756B64]">載入中…</p>
            ) : items.length === 0 ? (
              <p className="rounded-[16px] border border-dashed border-[#E9DED4] bg-white p-8 text-center text-sm text-[#756B64]">
                今天尚無服務紀錄
              </p>
            ) : (
              <div className="overflow-x-auto rounded-[16px] border border-[#E9DED4] bg-white">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-[#FAF6F1] text-[#756B64]">
                    <tr>
                      <th className="px-3 py-2 font-medium">類型</th>
                      <th className="px-3 py-2 font-medium">客戶</th>
                      <th className="px-3 py-2 font-medium">商品</th>
                      <th className="px-3 py-2 font-medium">狀態</th>
                      <th className="px-3 py-2 font-medium">追蹤</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-t border-[#E9DED4]">
                        <td className="px-3 py-2">{requestTypeLabel(row.request_type)}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-[#2F2925]">{row.customer_name}</p>
                          <p className="text-xs text-[#756B64]">{row.customer_phone}</p>
                        </td>
                        <td className="px-3 py-2">
                          {row.products?.name ?? "—"}
                          {(() => {
                            const b = row.products?.brands;
                            const brand = Array.isArray(b) ? b[0]?.name : b?.name;
                            return brand ? (
                              <span className="ml-1 text-xs text-[#756B64]">{brand}</span>
                            ) : null;
                          })()}
                          {row.quantity != null ? (
                            <span className="ml-1 text-xs text-[#756B64]">×{row.quantity}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="rounded-lg border border-[#E9DED4] bg-white px-2 py-1 text-xs"
                            value={row.status}
                            onChange={(e) =>
                              void patchTrack(row.id, {
                                status: e.target.value as StoreCustomerRequest["status"],
                              })
                            }
                          >
                            {STORE_CUSTOMER_STATUSES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            {(
                              [
                                ["track_notified", "已通知"],
                                ["track_paid", "已付款"],
                                ["track_picked_up", "已取貨"],
                                ["track_done", "已完成"],
                              ] as const
                            ).map(([key, label]) => (
                              <label key={key} className="inline-flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={Boolean(row[key])}
                                  onChange={(e) =>
                                    void patchTrack(row.id, { [key]: e.target.checked })
                                  }
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                          <p className="mt-1 text-[11px] text-[#756B64]">
                            {requestStatusLabel(row.status)}
                            {row.assigned_to_name ? ` · ${row.assigned_to_name}` : ""}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="space-y-4 rounded-[20px] border border-[#E9DED4] bg-white p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 rounded-full bg-[#FAF6F1] p-1">
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
                      ? "bg-[#FFF5C7] font-semibold text-[#153E73]"
                      : "text-[#756B64]"
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

          {doneMsg ? (
            <div className="flex items-center gap-2 rounded-[12px] bg-[#E8F5EE] px-3 py-2 text-sm text-[#2E7D5B]">
              <CheckCircle2 className="h-4 w-4" />
              {doneMsg}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-[#756B64]">客戶姓名 *</span>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-[#756B64]">聯絡電話 *</span>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm text-[#756B64]">客戶來源</p>
            <div className="flex flex-wrap gap-2">
              {STORE_CUSTOMER_SOURCES.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
                    source === s.id
                      ? "border-[#FFE149] bg-[#FFF5C7]"
                      : "border-[#E9DED4] bg-white"
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
            placeholder="📷 掃描或輸入條碼"
            onSelect={(p) => {
              setProduct(p as ProductHit);
              setProductQ(p.name);
            }}
          />

          <div className="space-y-2">
            <label className="block space-y-1 text-sm">
              <span className="text-[#756B64]">搜尋商品（共用 products）</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#756B64]" />
                <Input
                  className="pl-9"
                  value={productQ}
                  onChange={(e) => setProductQ(e.target.value)}
                  placeholder="例：高筋麵粉"
                />
              </div>
            </label>
            {productHits.length > 0 ? (
              <ul className="max-h-48 overflow-auto rounded-[12px] border border-[#E9DED4]">
                {productHits.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 border-b border-[#E9DED4] px-3 py-2 text-left text-sm hover:bg-[#FFFBEA]"
                      onClick={() => {
                        setProduct(p);
                        setProductQ(p.name);
                        setProductHits([]);
                      }}
                    >
                      <span>
                        <span className="font-medium text-[#2F2925]">{p.name}</span>
                        <span className="ml-2 text-xs text-[#756B64]">
                          {p.brand || p.supplier_name || p.sku}
                        </span>
                      </span>
                      <span className="text-xs text-[#756B64]">
                        {p.price != null ? `$${p.price}` : ""} · 庫存 {p.stock ?? "—"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {product ? (
            <div className="rounded-[14px] border border-[#E9DED4] bg-[#FAF6F1] p-4 text-sm">
              <p className="text-base font-semibold text-[#2F2925]">{product.name}</p>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                <p>品牌：{product.brand || "—"}</p>
                <p>廠商：{product.supplier_name || "—"}</p>
                <p>規格：{product.specifications || product.package_spec || product.unit || "—"}</p>
                <p>售價：{product.price != null ? `$${product.price}` : "—"}</p>
                <p className="flex items-center gap-2">
                  目前庫存：{stockQty ?? "—"}
                  {inStock === true ? (
                    <span className="text-[#2E7D5B]">🟢 有庫存</span>
                  ) : inStock === false ? (
                    <span className="text-[#C94C4C]">🔴 缺貨</span>
                  ) : null}
                </p>
                <p className="font-mono text-xs text-[#756B64]">
                  條碼 {product.barcode || "—"}
                </p>
              </div>
              <p className="mt-2">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="text-xs text-primary underline"
                >
                  開啟商品主檔
                </Link>
              </p>
            </div>
          ) : null}

          {tab === "order" ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#756B64]">數量</span>
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
                  className="w-20 text-center"
                  value={qty}
                  min={1}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                />
                <Button type="button" size="sm" variant="outline" onClick={() => setQty((n) => n + 1)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <label className="block space-y-1 text-sm">
                <span className="text-[#756B64]">預計到貨日（選填）</span>
                <Input
                  type="date"
                  value={expectedArrival}
                  onChange={(e) => setExpectedArrival(e.target.value)}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-[#756B64]">備註</span>
                <textarea
                  className="input-field min-h-[88px] w-full rounded-[10px] border border-[#E9DED4] px-3 py-2 text-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <label className="block space-y-1 text-sm">
                <span className="text-[#756B64]">詢問內容</span>
                <textarea
                  className="input-field min-h-[100px] w-full rounded-[10px] border border-[#E9DED4] px-3 py-2 text-sm"
                  placeholder={"例：是否有大量價格？\n希望 100 包"}
                  value={inquiryBody}
                  onChange={(e) => setInquiryBody(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={needsReply}
                  onChange={(e) => setNeedsReply(e.target.checked)}
                />
                是否需要回覆
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-[#756B64]">指派</span>
                <select
                  className="w-full rounded-[10px] border border-[#E9DED4] bg-white px-3 py-2"
                  value={assignedToName}
                  onChange={(e) => setAssignedToName(e.target.value)}
                >
                  <option value="業務">業務</option>
                  <option value="店長">店長</option>
                  <option value="客服">客服</option>
                  <option value="倉儲">倉儲</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-[#756B64]">備註</span>
                <textarea
                  className="input-field min-h-[72px] w-full rounded-[10px] border border-[#E9DED4] px-3 py-2 text-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
            </>
          )}

          <label className="block space-y-1 text-sm">
            <span className="text-[#756B64]">內部備註（客戶不可見）</span>
            <Input value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setMode("home")}>
              取消
            </Button>
            <Button type="button" disabled={saving} onClick={() => void submit()}>
              {saving ? "建立中…" : "確認建立"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
