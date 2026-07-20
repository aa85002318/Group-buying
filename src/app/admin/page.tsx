"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminBarChart,
  AdminDonutChart,
  AdminLineChart,
} from "@/components/admin/v2/AdminCharts";
import { formatCurrency } from "@/lib/utils";

type Period = "today" | "yesterday" | "week" | "month" | "all";

type DashboardData = {
  stats: {
    todayOrders: number;
    todaySales: number;
    todayGrossProfit: number;
    todayAvgOrder: number;
    todayReturns: number;
    yesterdaySales: number;
    weekSales: number;
    monthSales: number;
    lowStockProducts: number;
    closingSoonProducts: Array<{ id: string; name: string }>;
  };
  charts: {
    revenueTrend: Array<{ label: string; value: number }>;
    topProducts: Array<{ label: string; value: number }>;
    topCategories: Array<{ label: string; value: number }>;
    genderRatio: Array<{ label: string; value: number; color: string }>;
    cityHotspots: Array<{ label: string; value: number }>;
  };
};

const periods: Array<{ value: Period; label: string }> = [
  { value: "today", label: "今日" },
  { value: "yesterday", label: "昨日" },
  { value: "week", label: "本週" },
  { value: "month", label: "本月" },
  { value: "all", label: "全部" },
];

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const charts = data?.charts;

  const periodSales = (() => {
    if (!stats) return 0;
    switch (period) {
      case "today": return stats.todaySales;
      case "yesterday": return stats.yesterdaySales;
      case "week": return stats.weekSales;
      case "month": return stats.monthSales;
      default: return stats.monthSales;
    }
  })();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="儀表板"
        description="Shopify 風格營運總覽：銷售、庫存、客戶與商品分析"
      />

      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              period === p.value
                ? "bg-[#FF4F7B] text-white"
                : "border border-[#E2E8F0] bg-white text-[#475569] hover:border-[#FF4F7B]/40"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[#64748B]">載入中…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "營業額", value: formatCurrency(periodSales) },
              { label: "今日訂單數", value: stats?.todayOrders ?? 0 },
              { label: "今日毛利", value: formatCurrency(stats?.todayGrossProfit ?? 0) },
              { label: "今日客單價", value: formatCurrency(stats?.todayAvgOrder ?? 0) },
              { label: "今日退貨", value: stats?.todayReturns ?? 0 },
              { label: "低庫存商品", value: stats?.lowStockProducts ?? 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[20px] border border-[#E8EBF4] bg-white p-5 shadow-[0_4px_24px_rgba(30,58,138,0.06)]"
              >
                <p className="text-sm text-[#64748B]">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-[#1E3A8A]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[20px] border border-[#E8EBF4] bg-white p-5 shadow-[0_4px_24px_rgba(30,58,138,0.06)]">
              <h2 className="mb-4 font-bold text-[#1E293B]">營業額趨勢</h2>
              <AdminLineChart data={charts?.revenueTrend ?? []} />
            </section>
            <section className="rounded-[20px] border border-[#E8EBF4] bg-white p-5 shadow-[0_4px_24px_rgba(30,58,138,0.06)]">
              <h2 className="mb-4 font-bold text-[#1E293B]">商品排行榜</h2>
              <AdminBarChart
                data={(charts?.topProducts ?? []).map((d, i) => ({
                  ...d,
                  color: ["#FF4F7B", "#1E3A8A", "#FFC400", "#23B26D", "#A93DDB"][i],
                }))}
              />
            </section>
            <section className="rounded-[20px] border border-[#E8EBF4] bg-white p-5 shadow-[0_4px_24px_rgba(30,58,138,0.06)]">
              <h2 className="mb-4 font-bold text-[#1E293B]">類別排行榜</h2>
              <AdminBarChart data={charts?.topCategories ?? []} />
            </section>
            <section className="rounded-[20px] border border-[#E8EBF4] bg-white p-5 shadow-[0_4px_24px_rgba(30,58,138,0.06)]">
              <h2 className="mb-4 font-bold text-[#1E293B]">男女比例</h2>
              <AdminDonutChart segments={charts?.genderRatio ?? []} />
            </section>
            <section className="rounded-[20px] border border-[#E8EBF4] bg-white p-5 shadow-[0_4px_24px_rgba(30,58,138,0.06)]">
              <h2 className="mb-4 font-bold text-[#1E293B]">縣市熱區</h2>
              <AdminBarChart
                data={(charts?.cityHotspots ?? []).map((d) => ({ ...d, color: "#1E3A8A" }))}
              />
            </section>
            <section className="rounded-[20px] border border-[#E8EBF4] bg-white p-5 shadow-[0_4px_24px_rgba(30,58,138,0.06)]">
              <h2 className="mb-4 font-bold text-[#1E293B]">今日即將收單</h2>
              {(stats?.closingSoonProducts ?? []).length === 0 ? (
                <p className="text-sm text-[#94A3B8]">目前沒有即將收單商品</p>
              ) : (
                <ul className="space-y-2">
                  {stats?.closingSoonProducts.map((p) => (
                    <li key={p.id}>
                      <Link href={`/admin/products/${p.id}/edit`} className="text-sm font-semibold text-[#FF4F7B] hover:underline">
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="rounded-[20px] border border-[#E8EBF4] bg-white p-5">
            <h2 className="mb-3 font-bold text-[#1E293B]">快速操作</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/admin/products/new" className="font-semibold text-[#FF4F7B] hover:underline">→ 新增商品</Link>
              <Link href="/admin/products/import" className="font-semibold text-[#FF4F7B] hover:underline">→ 批次匯入</Link>
              <Link href="/admin/inventory" className="font-semibold text-[#FF4F7B] hover:underline">→ 庫存報表</Link>
              <Link href="/admin/reports" className="font-semibold text-[#FF4F7B] hover:underline">→ 銷售報表</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
