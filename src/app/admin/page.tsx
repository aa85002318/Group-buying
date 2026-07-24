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
    todayMallOrders?: number;
    todayGroupBuyOrders?: number;
    yesterdaySales: number;
    weekSales: number;
    monthSales: number;
    pendingPayment?: number;
    paymentPendingConfirm?: number;
    readyPickup?: number;
    newMembers?: number;
    lowStockProducts: number;
    closingSoonProducts: Array<{ id: string; name: string }>;
    publishedRecipes?: number;
    publishedVideos?: number;
    publishedNews?: number;
    scheduledNotifications?: number;
    activeBenefits?: number;
    expiring7?: number;
    openDisposals?: number;
    openIssues?: number;
    pendingRecipeQuestions?: number;
    pendingSubmissions?: number;
    activeGroupBuys?: number;
    upcomingCourses?: number;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/dashboard")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setData(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const charts = data?.charts;

  const periodSales = (() => {
    if (!stats) return 0;
    switch (period) {
      case "today":
        return stats.todaySales;
      case "yesterday":
        return stats.yesterdaySales;
      case "week":
        return stats.weekSales;
      case "month":
        return stats.monthSales;
      default:
        return stats.monthSales;
    }
  })();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="營運總覽"
        description="訂單、門市效期庫存、食譜與團購的整體營運儀表板"
      />

      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              period === p.value
                ? "bg-primary text-white"
                : "border border-border bg-white text-foreground-secondary hover:border-primary/40"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-foreground-secondary">載入中…</p>
      ) : error ? (
        <div className="rounded-[20px] border border-border bg-white p-5 text-sm text-red-600">
          {error}
          <button
            type="button"
            className="ml-3 font-semibold text-primary underline"
            onClick={() => window.location.reload()}
          >
            重試
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "今日訂單", value: stats?.todayOrders ?? 0, href: "/admin/orders" },
              { label: "今日營業額", value: formatCurrency(stats?.todaySales ?? 0), href: "/admin/orders" },
              { label: "今日新增會員", value: stats?.newMembers ?? 0, href: "/admin/members" },
              { label: "待處理取貨", value: stats?.readyPickup ?? 0, href: "/admin/pickup" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-[16px] border border-[#E9DED4] bg-white p-5 shadow-sm transition hover:border-[#6F4E37]/40"
              >
                <p className="text-sm text-[#756B64]">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-[#2F2925]">{item.value}</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "7 天內到期商品",
                value: stats?.expiring7 ?? 0,
                href: "/admin/store/expiry?range=7",
              },
              {
                label: "低庫存商品",
                value: stats?.lowStockProducts ?? 0,
                href: "/admin/store/inventory?low=1",
              },
              {
                label: "待處理報廢",
                value: stats?.openDisposals ?? 0,
                href: "/admin/store/disposals?status=open",
              },
              {
                label: "待處理異常",
                value: stats?.openIssues ?? 0,
                href: "/admin/store/issues?status=open",
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-[16px] border border-[#E9DED4] bg-white p-5 shadow-sm transition hover:border-[#6F4E37]/40"
              >
                <p className="text-sm text-[#756B64]">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-[#2F2925]">{item.value}</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "待回答食譜問題",
                value: stats?.pendingRecipeQuestions ?? 0,
                href: "/admin/recipes",
              },
              {
                label: "待審核成品",
                value: stats?.pendingSubmissions ?? 0,
                href: "/admin/recipes",
              },
              {
                label: "進行中團購",
                value: stats?.activeGroupBuys ?? 0,
                href: "/admin/group-buy",
              },
              {
                label: "近期課程",
                value: stats?.upcomingCourses ?? 0,
                href: "/admin/courses",
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-[16px] border border-[#E9DED4] bg-white p-5 shadow-sm transition hover:border-[#6F4E37]/40"
              >
                <p className="text-sm text-[#756B64]">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-[#2F2925]">{item.value}</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "App 訂單營業額（區間）", value: formatCurrency(periodSales) },
              { label: "今日商城訂單", value: stats?.todayMallOrders ?? 0 },
              { label: "今日團購訂單", value: stats?.todayGroupBuyOrders ?? 0 },
              { label: "待處理付款", value: stats?.pendingPayment ?? 0, href: "/admin/orders" },
              { label: "待確認付款", value: stats?.paymentPendingConfirm ?? 0, href: "/admin/payments" },
              { label: "今日 App 毛利", value: formatCurrency(stats?.todayGrossProfit ?? 0) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[20px] border border-border bg-white p-5 shadow-card"
              >
                <p className="text-sm text-foreground-secondary">{item.label}</p>
                {"href" in item && item.href ? (
                  <Link href={item.href} className="mt-1 block text-2xl font-black text-primary hover:underline">
                    {item.value}
                  </Link>
                ) : (
                  <p className="mt-1 text-2xl font-black text-foreground">{item.value}</p>
                )}
              </div>
            ))}
          </div>

          <section className="space-y-3">
            <h2 className="font-bold text-foreground">內容與會員營運</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                { label: "已發布食譜", value: stats?.publishedRecipes ?? 0, href: "/admin/recipes" },
                { label: "已發布影音", value: stats?.publishedVideos ?? 0, href: "/admin/videos" },
                { label: "已發布最新資訊", value: stats?.publishedNews ?? 0, href: "/admin/news" },
                {
                  label: "未發送排程通知",
                  value: stats?.scheduledNotifications ?? 0,
                  href: "/admin/notifications",
                },
                { label: "進行中福利", value: stats?.activeBenefits ?? 0, href: "/admin/benefits" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-[20px] border border-border bg-white p-5 shadow-card transition hover:border-primary/40"
                >
                  <p className="text-sm text-foreground-secondary">{item.label}</p>
                  <p className="mt-1 text-2xl font-black text-foreground">{item.value}</p>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
              <h2 className="mb-4 font-bold text-foreground">App 營業額趨勢</h2>
              <AdminLineChart data={charts?.revenueTrend ?? []} />
            </section>
            <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
              <h2 className="mb-4 font-bold text-foreground">商品排行榜</h2>
              <AdminBarChart
                data={(charts?.topProducts ?? []).map((d, i) => ({
                  ...d,
                  color: ["#FF6B6B", "#5C4033", "#FFD166", "#23B26D", "#A93DDB"][i],
                }))}
              />
            </section>
            <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
              <h2 className="mb-4 font-bold text-foreground">類別排行榜</h2>
              <AdminBarChart data={charts?.topCategories ?? []} />
            </section>
            <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
              <h2 className="mb-4 font-bold text-foreground">男女比例</h2>
              <AdminDonutChart segments={charts?.genderRatio ?? []} />
            </section>
            <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
              <h2 className="mb-4 font-bold text-foreground">縣市熱區</h2>
              <AdminBarChart
                data={(charts?.cityHotspots ?? []).map((d) => ({ ...d, color: "#5C4033" }))}
              />
            </section>
            <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
              <h2 className="mb-4 font-bold text-foreground">今日即將收單</h2>
              {(stats?.closingSoonProducts ?? []).length === 0 ? (
                <p className="text-sm text-foreground-muted">目前沒有即將收單商品</p>
              ) : (
                <ul className="space-y-2">
                  {stats?.closingSoonProducts.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="rounded-[20px] border border-border bg-white p-5">
            <h2 className="mb-3 font-bold text-foreground">快速操作</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/admin/store" className="font-semibold text-primary hover:underline">
                → 門市管理
              </Link>
              <Link href="/admin/orders" className="font-semibold text-primary hover:underline">
                → App 訂單
              </Link>
              <Link href="/admin/recipes" className="font-semibold text-primary hover:underline">
                → 食譜
              </Link>
              <Link href="/admin/notifications" className="font-semibold text-primary hover:underline">
                → 通知管理
              </Link>
              <Link href="/admin/home" className="font-semibold text-primary hover:underline">
                → 首頁／CMS 管理
              </Link>
              <Link href="/admin/products/new" className="font-semibold text-primary hover:underline">
                → 新增商品
              </Link>
              <Link href="/admin/store/expiry?range=7" className="font-semibold text-primary hover:underline">
                → 7 天內效期
              </Link>
              <Link href="/admin/inventory" className="font-semibold text-primary hover:underline">
                → 庫存報表
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
