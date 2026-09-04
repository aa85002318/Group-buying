"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  normalizeDisplayOptions,
  type Quotation,
  type QuotationDisplayOptions,
  type QuotationItem,
} from "@/lib/admin/quotations";
import { formatCurrency } from "@/lib/utils";

export default function AdminQuotationPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/quotations/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) throw new Error(d.error);
        setQuote({
          ...d.quotation,
          display_options: normalizeDisplayOptions(d.quotation.display_options),
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "載入失敗");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!quote) return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [quote]);

  if (loading) return <p className="p-8 text-sm">載入中…</p>;
  if (error || !quote) return <p className="p-8 text-sm text-red-600">{error ?? "找不到報價單"}</p>;

  const opt: QuotationDisplayOptions = quote.display_options;
  const items = (quote.quotation_items ?? []) as QuotationItem[];

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-[#111] print:max-w-none print:p-0">
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          className="rounded-lg border px-3 py-1.5 text-sm"
          onClick={() => window.print()}
        >
          列印
        </button>
        <Link href={`/admin/quotations/${id}`} className="rounded-lg border px-3 py-1.5 text-sm">
          返回編輯
        </Link>
      </div>

      <header className="mb-6 border-b border-gray-300 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            {opt.showCompanyHeader ? (
              <h1 className="text-2xl font-bold tracking-wide">奇美 DIY 團購</h1>
            ) : null}
            {opt.showLogo ? (
              <p className="mt-1 text-xs text-gray-500">chimeidiygroupbuying.com</p>
            ) : null}
            {opt.showTaxId && quote.tax_id ? (
              <p className="mt-1 text-sm">客戶統編：{quote.tax_id}</p>
            ) : null}
          </div>
          <div className="text-right text-sm">
            <p className="text-lg font-semibold">報價單</p>
            <p>{quote.quote_number}</p>
            {opt.showValidUntil && quote.valid_until ? (
              <p className="mt-1">效期至 {quote.valid_until}</p>
            ) : null}
          </div>
        </div>
      </header>

      {opt.showCustomerBlock ? (
        <section className="mb-6 grid gap-1 text-sm sm:grid-cols-2">
          <p>
            <span className="text-gray-500">公司：</span>
            {quote.company_name || "—"}
          </p>
          <p>
            <span className="text-gray-500">聯絡人：</span>
            {quote.contact_name || "—"}
          </p>
          <p>
            <span className="text-gray-500">電話：</span>
            {quote.contact_phone || "—"}
          </p>
          <p>
            <span className="text-gray-500">Email：</span>
            {quote.contact_email || "—"}
          </p>
          {quote.address ? (
            <p className="sm:col-span-2">
              <span className="text-gray-500">地址：</span>
              {quote.address}
            </p>
          ) : null}
        </section>
      ) : null}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-800 text-left">
            <th className="py-2 pr-2">品名</th>
            {opt.showSku ? <th className="py-2 pr-2">SKU</th> : null}
            {opt.showBarcode ? <th className="py-2 pr-2">條碼</th> : null}
            {opt.showUnit ? <th className="py-2 pr-2">單位</th> : null}
            <th className="py-2 pr-2 text-right">數量</th>
            {opt.showUnitPrice ? <th className="py-2 pr-2 text-right">單價</th> : null}
            {opt.showLineSubtotal ? <th className="py-2 text-right">小計</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-200 align-top">
              <td className="py-2 pr-2">
                {item.product_name}
                {item.note ? (
                  <span className="mt-0.5 block text-xs text-gray-500">{item.note}</span>
                ) : null}
              </td>
              {opt.showSku ? <td className="py-2 pr-2">{item.sku || "—"}</td> : null}
              {opt.showBarcode ? <td className="py-2 pr-2">{item.barcode || "—"}</td> : null}
              {opt.showUnit ? <td className="py-2 pr-2">{item.unit || "—"}</td> : null}
              <td className="py-2 pr-2 text-right">{item.quantity}</td>
              {opt.showUnitPrice ? (
                <td className="py-2 pr-2 text-right">{formatCurrency(Number(item.unit_price) || 0)}</td>
              ) : null}
              {opt.showLineSubtotal ? (
                <td className="py-2 text-right">{formatCurrency(Number(item.subtotal) || 0)}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-6 ml-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span>小計</span>
          <span>{formatCurrency(Number(quote.subtotal) || 0)}</span>
        </div>
        {opt.showDiscount ? (
          <div className="flex justify-between">
            <span>折扣</span>
            <span>-{formatCurrency(Number(quote.discount_amount) || 0)}</span>
          </div>
        ) : null}
        {opt.showShipping ? (
          <div className="flex justify-between">
            <span>運費</span>
            <span>{formatCurrency(Number(quote.shipping_fee) || 0)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-gray-800 pt-2 text-base font-bold">
          <span>合計</span>
          <span>{formatCurrency(Number(quote.total_amount) || 0)}</span>
        </div>
      </section>

      {opt.showNotes && quote.notes ? (
        <section className="mt-6 text-sm">
          <p className="font-semibold">備註</p>
          <p className="mt-1 whitespace-pre-wrap text-gray-700">{quote.notes}</p>
        </section>
      ) : null}

      {opt.showSignature ? (
        <section className="mt-16 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="mb-10 border-b border-gray-400 pb-1">客戶簽收</p>
          </div>
          <div>
            <p className="mb-10 border-b border-gray-400 pb-1">業務確認</p>
          </div>
        </section>
      ) : null}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          nav,
          aside,
          header.sticky,
          .admin-icon-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
