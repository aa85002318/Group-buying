"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminBarChart, AdminLineChart } from "@/components/admin/v2/AdminCharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types/database";

type SalesReport = {
  summary: {
    revenue: number;
    grossProfit: number;
    orderCount: number;
    avgOrderValue: number;
    itemsSold: number;
    returns: number;
  };
  trend: Array<{ label: string; value: number }>;
  topProducts: Array<{ label: string; value: number }>;
};

const exportReports = [
  { title: "訂單報表", description: "匯出所有訂單明細（Excel）", href: "/api/admin/orders/export?format=xlsx" },
  { title: "分潤報表", description: "匯出分潤紀錄明細（Excel）", href: "/api/admin/commission-records/export?format=xlsx" },
];

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [report, setReport] = useState<SalesReport | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    fetch(`/api/admin/reports/sales?period=${period}`)
      .then((r) => r.json())
      .then((d) => setReport(d))
      .catch(() => {});
  }, [period]);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => {});
  }, []);

  const productExportHref = (() => {
    if (!productId) return "#";
    const params = new URLSearchParams({ format: "xlsx", productId });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `/api/admin/reports/product-export?${params.toString()}`;
  })();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="銷售報表"
        description="每日售出、營業額、毛利、客單價與退貨分析"
        actions={
          <Link href="/admin">
            <Button variant="outline">返回儀表板</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(["today", "week", "month"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              period === p
                ? "bg-[#FF4F7B] text-white"
                : "border border-[#E2E8F0] bg-white text-[#475569]"
            }`}
          >
            {p === "today" ? "今日" : p === "week" ? "本週" : "本月"}
          </button>
        ))}
      </div>

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "營業額", value: formatCurrency(report.summary.revenue) },
              { label: "毛利", value: formatCurrency(report.summary.grossProfit) },
              { label: "訂單數", value: report.summary.orderCount },
              { label: "客單價", value: formatCurrency(report.summary.avgOrderValue) },
              { label: "售出商品數", value: report.summary.itemsSold },
              { label: "退貨", value: report.summary.returns },
            ].map((item) => (
              <div key={item.label} className="rounded-[20px] border border-[#E8EBF4] bg-white p-5">
                <p className="text-sm text-[#64748B]">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-[#1E3A8A]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[20px] border border-[#E8EBF4] bg-white p-5">
              <h2 className="mb-4 font-bold text-[#1E293B]">營業額趨勢</h2>
              <AdminLineChart data={report.trend} />
            </section>
            <section className="rounded-[20px] border border-[#E8EBF4] bg-white p-5">
              <h2 className="mb-4 font-bold text-[#1E293B]">熱銷商品</h2>
              <AdminBarChart data={report.topProducts.map((d) => ({ ...d, color: "#FF4F7B" }))} />
            </section>
          </div>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {exportReports.map((r) => (
          <div key={r.title} className="rounded-[20px] border border-[#E8EBF4] bg-white p-5">
            <h2 className="font-bold text-[#1E293B]">{r.title}</h2>
            <p className="mt-1 text-sm text-[#64748B]">{r.description}</p>
            <a href={r.href} className="mt-3 inline-flex text-sm font-semibold text-[#FF4F7B] hover:underline">
              下載 Excel →
            </a>
          </div>
        ))}
      </div>

      <div className="rounded-[20px] border border-[#E8EBF4] bg-white p-5">
        <h2 className="font-bold text-[#1E293B]">單一商品團購報表</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <select className="h-11 rounded-xl border border-[#E2E8F0] px-3 text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">選擇商品</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {productId ? (
          <a href={productExportHref} className="mt-4 inline-block">
            <Button>下載產品報表 Excel</Button>
          </a>
        ) : (
          <Button className="mt-4" disabled>請先選擇商品</Button>
        )}
      </div>
    </div>
  );
}
