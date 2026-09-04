"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import {
  calcQuotationTotals,
  DEFAULT_QUOTATION_DISPLAY_OPTIONS,
  DISPLAY_OPTION_FIELDS,
  QUOTATION_STATUS_LABELS,
  normalizeDisplayOptions,
  type QuotationDisplayOptions,
  type QuotationStatus,
} from "@/lib/admin/quotations";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type DraftItem = {
  key: string;
  product_id: string | null;
  product_name: string;
  sku: string;
  barcode: string;
  unit: string;
  quantity: number;
  unit_price: number;
  note: string;
};

type MemberHit = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  member_code?: string | null;
};

type ProductHit = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  unit?: string | null;
  price?: number;
};

function newItemKey() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyItem(): DraftItem {
  return {
    key: newItemKey(),
    product_id: null,
    product_name: "",
    sku: "",
    barcode: "",
    unit: "件",
    quantity: 1,
    unit_price: 0,
    note: "",
  };
}

type Props = {
  mode: "create" | "edit";
  quotationId?: string;
};

export function QuotationEditor({ mode, quotationId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);
  const [status, setStatus] = useState<QuotationStatus>("draft");
  const [convertedOrderId, setConvertedOrderId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [displayOptions, setDisplayOptions] = useState<QuotationDisplayOptions>({
    ...DEFAULT_QUOTATION_DISPLAY_OPTIONS,
  });

  const [productQuery, setProductQuery] = useState("");
  const [productHits, setProductHits] = useState<ProductHit[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberHits, setMemberHits] = useState<MemberHit[]>([]);
  const [boundMemberLabel, setBoundMemberLabel] = useState<string | null>(null);

  const totals = useMemo(
    () => calcQuotationTotals(items, discountAmount, shippingFee),
    [items, discountAmount, shippingFee]
  );

  const locked = status === "converted";

  const load = useCallback(async () => {
    if (mode !== "edit" || !quotationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quotations/${quotationId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      const q = data.quotation;
      setQuoteNumber(q.quote_number);
      setStatus(q.status);
      setConvertedOrderId(q.converted_order_id ?? null);
      setCompanyName(q.company_name ?? "");
      setContactName(q.contact_name ?? "");
      setContactPhone(q.contact_phone ?? "");
      setContactEmail(q.contact_email ?? "");
      setTaxId(q.tax_id ?? "");
      setAddress(q.address ?? "");
      setUserId(q.user_id ?? null);
      setValidUntil(q.valid_until ?? "");
      setNotes(q.notes ?? "");
      setDiscountAmount(Number(q.discount_amount) || 0);
      setShippingFee(Number(q.shipping_fee) || 0);
      setDisplayOptions(normalizeDisplayOptions(q.display_options));
      const lines = (q.quotation_items ?? []) as Array<Record<string, unknown>>;
      setItems(
        lines.length
          ? lines.map((line) => ({
              key: String(line.id ?? newItemKey()),
              product_id: (line.product_id as string | null) ?? null,
              product_name: String(line.product_name ?? ""),
              sku: String(line.sku ?? ""),
              barcode: String(line.barcode ?? ""),
              unit: String(line.unit ?? "件"),
              quantity: Number(line.quantity) || 1,
              unit_price: Number(line.unit_price) || 0,
              note: String(line.note ?? ""),
            }))
          : [emptyItem()]
      );
      if (q.user_id) {
        setBoundMemberLabel(`已綁定會員 ${String(q.user_id).slice(0, 8)}…`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [mode, quotationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const q = productQuery.trim();
    if (q.length < 1) {
      setProductHits([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=12`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setProductHits((d.products ?? []) as ProductHit[]);
        })
        .catch(() => {
          if (!cancelled) setProductHits([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [productQuery]);

  useEffect(() => {
    const q = memberQuery.trim();
    if (q.length < 1) {
      setMemberHits([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      fetch(`/api/admin/members?search=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setMemberHits((d.members ?? []).slice(0, 10) as MemberHit[]);
        })
        .catch(() => {
          if (!cancelled) setMemberHits([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [memberQuery]);

  const addProduct = (p: ProductHit) => {
    setItems((prev) => [
      ...prev.filter((i) => i.product_name.trim() || i.product_id),
      {
        key: newItemKey(),
        product_id: p.id,
        product_name: p.name,
        sku: p.sku ?? "",
        barcode: p.barcode ?? "",
        unit: p.unit ?? "件",
        quantity: 1,
        unit_price: Number(p.price) || 0,
        note: "",
      },
    ]);
    setProductQuery("");
    setProductHits([]);
  };

  const buildPayload = () => ({
    company_name: companyName || null,
    contact_name: contactName,
    contact_phone: contactPhone || null,
    contact_email: contactEmail || null,
    tax_id: taxId || null,
    address: address || null,
    user_id: userId,
    discount_amount: discountAmount,
    shipping_fee: shippingFee,
    notes: notes || null,
    valid_until: validUntil || null,
    status,
    display_options: displayOptions,
    items: items
      .filter((i) => i.product_name.trim())
      .map((i, index) => ({
        product_id: i.product_id,
        product_name: i.product_name.trim(),
        sku: i.sku || null,
        barcode: i.barcode || null,
        unit: i.unit || null,
        quantity: Number(i.quantity) || 1,
        unit_price: Number(i.unit_price) || 0,
        note: i.note || null,
        sort_order: index,
      })),
  });

  const save = async () => {
    if (locked) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = buildPayload();
      if (!payload.items.length) throw new Error("請至少新增一筆明細");
      const res =
        mode === "create"
          ? await fetch("/api/admin/quotations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/admin/quotations/${quotationId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setMessage("已儲存");
      if (mode === "create" && data.quotation?.id) {
        router.replace(`/admin/quotations/${data.quotation.id}`);
      } else {
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const convert = async () => {
    if (!quotationId) {
      setError("請先儲存報價單再轉單");
      return;
    }
    if (!userId) {
      setError("轉單前請先搜尋並綁定會員");
      return;
    }
    if (!confirm("確定將此報價單轉成訂單？")) return;
    setConverting(true);
    setError(null);
    try {
      // Save latest edits first
      if (!locked) {
        const saveRes = await fetch(`/api/admin/quotations/${quotationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveData.error ?? "儲存失敗");
      }
      const res = await fetch(`/api/admin/quotations/${quotationId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "轉單失敗");
      setMessage(`已轉成訂單 ${data.orderNumber}`);
      router.push(`/admin/orders/${data.orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "轉單失敗");
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-[#8A94A6]">載入中…</p>;
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={mode === "create" ? "新建報價單" : `報價單 ${quoteNumber ?? ""}`}
        description="填寫客戶與商品明細；列印前可勾選要顯示的欄位。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/quotations">
              <Button variant="outline">返回列表</Button>
            </Link>
            {quotationId ? (
              <Link href={`/admin/quotations/${quotationId}/print`} target="_blank">
                <Button variant="secondary">預覽／列印</Button>
              </Link>
            ) : null}
            {convertedOrderId ? (
              <Link href={`/admin/orders/${convertedOrderId}`}>
                <Button variant="ghost">查看訂單</Button>
              </Link>
            ) : null}
          </div>
        }
      />

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {locked ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          此報價單已轉單，內容鎖定不可修改。
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[#153E73]">客戶資料</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-[#667085]">公司名稱</span>
                <input
                  className="input-field w-full"
                  value={companyName}
                  disabled={locked}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#667085]">聯絡人</span>
                <input
                  className="input-field w-full"
                  value={contactName}
                  disabled={locked}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#667085]">電話</span>
                <input
                  className="input-field w-full"
                  value={contactPhone}
                  disabled={locked}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#667085]">Email</span>
                <input
                  className="input-field w-full"
                  value={contactEmail}
                  disabled={locked}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#667085]">統一編號</span>
                <input
                  className="input-field w-full"
                  value={taxId}
                  disabled={locked}
                  onChange={(e) => setTaxId(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#667085]">報價效期</span>
                <input
                  className="input-field w-full"
                  type="date"
                  value={validUntil}
                  disabled={locked}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-[#667085]">地址</span>
                <input
                  className="input-field w-full"
                  value={address}
                  disabled={locked}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-[#667085]">備註</span>
                <textarea
                  className="input-field min-h-[80px] w-full"
                  value={notes}
                  disabled={locked}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#153E73]">商品明細</h2>
              {!locked ? (
                <div className="relative w-full max-w-sm">
                  <input
                    className="input-field h-10 w-full text-sm"
                    placeholder="搜尋商品名稱／SKU／條碼…"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                  />
                  {productHits.length > 0 ? (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                      {productHits.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-[#FFF5CC]"
                          onClick={() => addProduct(p)}
                        >
                          <span className="font-medium text-[#153E73]">{p.name}</span>
                          <span className="mt-0.5 block text-[10px] text-[#8A94A6]">
                            {[p.sku, p.barcode, formatCurrency(Number(p.price) || 0)]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#FFF5CC] text-left text-xs text-[#153E73]">
                  <tr>
                    <th className="px-2 py-2">品名</th>
                    <th className="px-2 py-2">SKU</th>
                    <th className="px-2 py-2">數量</th>
                    <th className="px-2 py-2">單價</th>
                    <th className="px-2 py-2">小計</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.key} className="border-t border-gray-100">
                      <td className="px-2 py-2">
                        <input
                          className="input-field h-9 w-full min-w-[140px]"
                          value={item.product_name}
                          disabled={locked}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((row, i) =>
                                i === idx ? { ...row, product_name: e.target.value } : row
                              )
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          className="input-field h-9 w-24"
                          value={item.sku}
                          disabled={locked}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((row, i) =>
                                i === idx ? { ...row, sku: e.target.value } : row
                              )
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          className="input-field h-9 w-20"
                          type="number"
                          min={0}
                          step="any"
                          value={item.quantity}
                          disabled={locked}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((row, i) =>
                                i === idx
                                  ? { ...row, quantity: Number(e.target.value) }
                                  : row
                              )
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          className="input-field h-9 w-24"
                          type="number"
                          min={0}
                          step="any"
                          value={item.unit_price}
                          disabled={locked}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((row, i) =>
                                i === idx
                                  ? { ...row, unit_price: Number(e.target.value) }
                                  : row
                              )
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                      <td className="px-2 py-2">
                        {!locked ? (
                          <button
                            type="button"
                            className="text-xs text-[#F16458]"
                            onClick={() =>
                              setItems((prev) =>
                                prev.length <= 1 ? [emptyItem()] : prev.filter((_, i) => i !== idx)
                              )
                            }
                          >
                            刪除
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!locked ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
              >
                新增空白列
              </Button>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block text-[#667085]">折扣</span>
                <input
                  className="input-field w-full"
                  type="number"
                  min={0}
                  value={discountAmount}
                  disabled={locked}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#667085]">運費</span>
                <input
                  className="input-field w-full"
                  type="number"
                  min={0}
                  value={shippingFee}
                  disabled={locked}
                  onChange={(e) => setShippingFee(Number(e.target.value))}
                />
              </label>
              <div className="rounded-xl bg-[#FFFEFA] p-3 text-sm">
                <p>小計 {formatCurrency(totals.subtotal)}</p>
                <p className="mt-1 text-base font-bold text-[#153E73]">
                  合計 {formatCurrency(totals.total_amount)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-[#153E73]">狀態</h2>
            <select
              className="input-field w-full"
              value={status}
              disabled={locked}
              onChange={(e) => setStatus(e.target.value as QuotationStatus)}
            >
              {Object.entries(QUOTATION_STATUS_LABELS)
                .filter(([value]) => value !== "converted" || status === "converted")
                .map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
            </select>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-[#153E73]">列印顯示內容</h2>
            <p className="mb-2 text-[11px] text-[#8A94A6]">勾選後儲存，列印頁會依此顯示。</p>
            <div className="space-y-1.5">
              {DISPLAY_OPTION_FIELDS.map((field) => (
                <label key={field.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={displayOptions[field.key]}
                    disabled={locked}
                    onChange={(e) =>
                      setDisplayOptions((prev) => ({
                        ...prev,
                        [field.key]: e.target.checked,
                      }))
                    }
                  />
                  {field.label}
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-[#153E73]">綁定會員（轉單必填）</h2>
            {boundMemberLabel ? (
              <p className="mb-2 text-xs text-green-700">{boundMemberLabel}</p>
            ) : null}
            {!locked ? (
              <>
                <input
                  className="input-field h-9 w-full text-sm"
                  placeholder="搜尋姓名／電話／Email…"
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                />
                {memberHits.length > 0 ? (
                  <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-100">
                    {memberHits.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={cn(
                          "block w-full px-2 py-1.5 text-left text-xs hover:bg-[#FFF5CC]",
                          userId === m.id && "bg-[#FFF5CC]"
                        )}
                        onClick={() => {
                          setUserId(m.id);
                          setBoundMemberLabel(
                            [m.full_name, m.phone, m.email].filter(Boolean).join(" · ")
                          );
                          if (!contactName && m.full_name) setContactName(m.full_name);
                          if (!contactPhone && m.phone) setContactPhone(m.phone);
                          if (!contactEmail && m.email) setContactEmail(m.email);
                          setMemberQuery("");
                          setMemberHits([]);
                        }}
                      >
                        {[m.full_name, m.phone, m.email].filter(Boolean).join(" · ")}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </section>

          <div className="flex flex-col gap-2">
            <Button type="button" onClick={() => void save()} disabled={saving || locked}>
              {saving ? "儲存中…" : "儲存報價單"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void convert()}
              disabled={converting || !quotationId || locked}
            >
              {converting ? "轉單中…" : "轉成訂單"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
