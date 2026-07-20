"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminBarChart } from "@/components/admin/v2/AdminCharts";
import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type Ranking = {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  soldQuantity: number;
  revenue: number;
  grossProfit: number;
  viewCount: number;
  favoriteCount: number;
  conversionRate: number;
  cartAddRate: number;
  rank: number;
};

type SortKey = "revenue" | "soldQuantity" | "conversionRate" | "viewCount" | "favoriteCount";

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: "revenue", label: "營業額" },
  { value: "soldQuantity", label: "售出數量" },
  { value: "conversionRate", label: "轉換率" },
  { value: "viewCount", label: "瀏覽數" },
  { value: "favoriteCount", label: "收藏數" },
];

export default function AdminProductsAnalysisPage() {
  const [sort, setSort] = useState<SortKey>("revenue");
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [summary, setSummary] = useState<{ totalProducts: number; totalRevenue: number; totalSold: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/products/analysis?sort=${sort}`)
      .then((r) => r.json())
      .then((d) => {
        const list = (d.rankings ?? []).map((r: Omit<Ranking, "rank">, i: number) => ({ ...r, rank: i + 1 }));
        setRankings(list);
        setSummary(d.summary ?? null);
      })
      .finally(() => setLoading(false));
  }, [sort]);

  const chartData = rankings.slice(0, 10).map((r) => ({
    label: r.name.length > 8 ? `${r.name.slice(0, 8)}…` : r.name,
    value: sort === "revenue" ? r.revenue : sort === "soldQuantity" ? r.soldQuantity : r[sort],
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="商品分析總覽"
        description="全站商品銷售排行榜與轉換表現"
        actions={
          <Link href="/admin/products">
            <Button variant="outline">返回商品列表</Button>
          </Link>
        }
      />

      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "商品總數", value: summary.totalProducts },
            { label: "總營業額", value: formatCurrency(summary.totalRevenue) },
            { label: "總售出數", value: summary.totalSold.toLocaleString() },
          ].map((item) => (
            <div key={item.label} className="rounded-[20px] border border-[#E8EBF4] bg-white p-5 shadow-[0_4px_24px_rgba(30,58,138,0.06)]">
              <p className="text-sm text-[#64748B]">{item.label}</p>
              <p className="mt-1 text-2xl font-black text-[#1E3A8A]">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSort(opt.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              sort === opt.value
                ? "bg-[#FF4F7B] text-white"
                : "bg-white text-[#64748B] border border-[#E8EBF4] hover:border-[#FF4F7B]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="rounded-[20px] border border-[#E8EBF4] bg-white p-6 shadow-[0_4px_24px_rgba(30,58,138,0.06)]">
          <h3 className="mb-4 font-semibold text-[#1E3A8A]">Top 10 商品</h3>
          <AdminBarChart data={chartData} />
        </div>
      )}

      <AdminTable
        loading={loading}
        emptyText="尚無商品資料"
        columns={[
          { key: "rank", header: "#", render: (r) => r.rank },
          {
            key: "product",
            header: "商品",
            render: (r) => (
              <div className="flex items-center gap-3">
                {r.image_url ? (
                  <Image src={r.image_url} alt={r.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-[#F7F8FC]" />
                )}
                <span className="font-medium text-[#1E3A8A]">{r.name}</span>
              </div>
            ),
          },
          { key: "soldQuantity", header: "售出", render: (r) => r.soldQuantity },
          { key: "revenue", header: "營業額", render: (r) => formatCurrency(r.revenue) },
          { key: "grossProfit", header: "毛利", render: (r) => formatCurrency(r.grossProfit) },
          { key: "viewCount", header: "瀏覽", render: (r) => r.viewCount.toLocaleString() },
          { key: "favoriteCount", header: "收藏", render: (r) => r.favoriteCount },
          { key: "conversionRate", header: "轉換率", render: (r) => `${r.conversionRate.toFixed(1)}%` },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <Link href={`/admin/products/${r.id}/analysis`}>
                <Button size="sm" variant="outline">詳細</Button>
              </Link>
            ),
          },
        ]}
        rows={rankings}
      />
    </div>
  );
}
