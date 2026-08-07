"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BookOpen,
  Clock3,
  FileText,
  ImagePlus,
  LayoutTemplate,
  Megaphone,
  MessageSquare,
  PackagePlus,
  ShoppingBag,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import {
  AdminBarChart,
  AdminDonutChart,
  AdminLineChart,
} from "@/components/admin/v2/AdminCharts";
import { useAdminShell } from "@/components/admin/AdminShell";
import { CustomerServiceHome } from "@/components/admin/CustomerServiceHome";
import { ContentEditorHome } from "@/components/admin/ContentEditorHome";
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

const WORKSPACE: Array<{
  title: string;
  href: string;
  Icon: LucideIcon;
  tone: string;
}> = [
  { title: "APP 版型設定", href: "/admin/home", Icon: LayoutTemplate, tone: "#FFF5CC" },
  { title: "文章新增", href: "/admin/articles/new", Icon: FileText, tone: "#EEF8FC" },
  { title: "門市協作中心", href: "/admin/store", Icon: Store, tone: "#FFF7CC" },
  { title: "團購新增", href: "/admin/products/new?mode=group-buy", Icon: ShoppingBag, tone: "#FFF0EE" },
  { title: "烘焙商品", href: "/admin/products", Icon: PackagePlus, tone: "#EFF9EE" },
  { title: "物流金流設定", href: "/admin/payments", Icon: Truck, tone: "#FFF0EE" },
  { title: "公司相關資訊", href: "/admin/stores?tab=company", Icon: Megaphone, tone: "#EEF8FC" },
  { title: "客服", href: "/admin/support", Icon: MessageSquare, tone: "#F3EEFF" },
  { title: "食譜新增", href: "/admin/recipes/new", Icon: BookOpen, tone: "#EEF8FC" },
];

const QUICK_CREATE: Array<{
  title: string;
  href: string;
  Icon: LucideIcon;
  color: string;
}> = [
  { title: "新增商品", href: "/admin/products/new", Icon: PackagePlus, color: "#FFE149" },
  { title: "新增團購", href: "/admin/products/new?mode=group-buy", Icon: ShoppingBag, color: "#F16458" },
  { title: "新增文章", href: "/admin/articles/new", Icon: FileText, color: "#79C7E8" },
  { title: "新增食譜", href: "/admin/recipes/new", Icon: BookOpen, color: "#43C47B" },
  { title: "新增 Banner", href: "/admin/banners", Icon: ImagePlus, color: "#5CA8FF" },
  { title: "新增公告", href: "/admin/content/popups", Icon: Megaphone, color: "#FFB238" },
];

function greetingLabel(name?: string | null) {
  const hour = new Date().getHours();
  const hi = hour < 12 ? "早安" : hour < 18 ? "午安" : "晚安";
  return `${hi}，${name?.trim() || "店長"}`;
}

function StatCard({
  label,
  value,
  href,
  Icon,
  hint,
  delay,
}: {
  label: string;
  value: string | number;
  href: string;
  Icon: LucideIcon;
  hint?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Link
        href={href}
        className="admin-surface-card admin-lift block rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF5C7] text-[var(--admin-title)]">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <ArrowUpRight className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
        </div>
        <p className="mt-4 text-sm text-[var(--admin-muted)]">{label}</p>
        <p className="mt-1 text-3xl font-bold text-[var(--admin-title)]">{value}</p>
        {hint ? <p className="mt-1 text-xs text-[var(--admin-muted)]">{hint}</p> : null}
      </Link>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const { profile } = useAdminShell();
  const role = profile?.role;

  if (!role) {
    return (
      <div className="space-y-4">
        <div className="admin-skeleton h-10 w-48" />
        <div className="admin-skeleton h-40 w-full" />
      </div>
    );
  }

  if (role === "customer_service") {
    return <CustomerServiceHome fullName={profile?.full_name} />;
  }
  if (role === "content_editor") {
    return <ContentEditorHome fullName={profile?.full_name} />;
  }

  return <AdminOpsDashboard fullName={profile?.full_name} />;
}

function AdminOpsDashboard({ fullName }: { fullName?: string | null }) {
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

  const periodSales = useMemo(() => {
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
  }, [period, stats]);

  const todos = useMemo(
    () =>
      [
        {
          label: "待處理付款",
          value: stats?.pendingPayment ?? 0,
          href: "/admin/orders",
        },
        {
          label: "待確認付款",
          value: stats?.paymentPendingConfirm ?? 0,
          href: "/admin/payments",
        },
        {
          label: "待處理異常",
          value: stats?.openIssues ?? 0,
          href: "/admin/store/issues?status=open",
        },
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
      ].filter((t) => Number(t.value) > 0),
    [stats]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--admin-muted)]">今日營運</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--admin-title)] md:text-[30px]">
            {greetingLabel(fullName)}
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            一眼掌握今天要處理的事，常用功能都在首頁。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`h-10 rounded-full px-4 text-sm font-semibold transition ${
                period === p.value
                  ? "bg-[#FFE149] text-[var(--admin-title)]"
                  : "border border-[var(--admin-border)] bg-white text-[var(--admin-text)] hover:bg-[var(--admin-hover)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="admin-skeleton h-[140px] w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-[var(--admin-border)] bg-white p-6 text-sm text-[var(--admin-danger)] shadow-[0_10px_35px_rgba(0,0,0,.05)]">
          {error}
          <button
            type="button"
            className="ml-3 font-semibold text-[var(--admin-title)] underline"
            onClick={() => window.location.reload()}
          >
            重試
          </button>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="今日訂單"
              value={stats?.todayOrders ?? 0}
              href="/admin/orders"
              Icon={ShoppingBag}
              hint={`營業額 ${formatCurrency(stats?.todaySales ?? 0)}`}
              delay={0.05}
            />
            <StatCard
              label="待處理"
              value={(stats?.pendingPayment ?? 0) + (stats?.readyPickup ?? 0)}
              href="/admin/orders"
              Icon={Clock3}
              hint={`取貨 ${stats?.readyPickup ?? 0} · 付款 ${stats?.pendingPayment ?? 0}`}
              delay={0.1}
            />
            <StatCard
              label="即期商品"
              value={stats?.expiring7 ?? 0}
              href="/admin/store/expiry?range=7"
              Icon={AlertTriangle}
              hint="7 天內到期批次"
              delay={0.15}
            />
            <StatCard
              label="異常"
              value={(stats?.openIssues ?? 0) + (stats?.openDisposals ?? 0)}
              href="/admin/store/issues?status=open"
              Icon={AlertTriangle}
              hint={`報廢 ${stats?.openDisposals ?? 0}`}
              delay={0.2}
            />
            <StatCard
              label="留言"
              value={(stats?.pendingRecipeQuestions ?? 0) + (stats?.pendingSubmissions ?? 0)}
              href="/admin/recipes"
              Icon={MessageSquare}
              hint="食譜問題／成品審核"
              delay={0.25}
            />
          </section>

          <section>
            <h2 className="mb-4 text-lg font-bold text-[var(--admin-title)]">工作區</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {WORKSPACE.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link
                    href={item.href}
                    className="admin-lift flex h-[104px] flex-col justify-between rounded-[24px] p-4 shadow-[0_10px_35px_rgba(0,0,0,.05)] transition"
                    style={{ background: item.tone }}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-[var(--admin-title)]">
                      <item.Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-sm font-bold text-[var(--admin-title)]">{item.title}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="admin-surface-card rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-[var(--admin-title)]">系統公告</h2>
                <Link href="/admin/content/popups" className="text-sm font-semibold text-[var(--admin-title)] hover:underline">
                  管理
                </Link>
              </div>
              <ul className="space-y-3 text-sm text-[var(--admin-text)]">
                <li className="rounded-2xl bg-[#FFFDF6] px-3 py-3">
                  已發布最新資訊 {stats?.publishedNews ?? 0} 則
                </li>
                <li className="rounded-2xl bg-[#FFFDF6] px-3 py-3">
                  未發送排程通知 {stats?.scheduledNotifications ?? 0} 則
                </li>
                <li className="rounded-2xl bg-[#FFFDF6] px-3 py-3">
                  進行中福利 {stats?.activeBenefits ?? 0} 項
                </li>
              </ul>
            </div>

            <div className="admin-surface-card rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]">
              <h2 className="mb-4 text-lg font-bold text-[var(--admin-title)]">待辦事項</h2>
              {todos.length === 0 ? (
                <p className="text-sm text-[var(--admin-muted)]">目前沒有待處理項目，狀態良好。</p>
              ) : (
                <ul className="space-y-2">
                  {todos.map((t) => (
                    <li key={t.label}>
                      <Link
                        href={t.href}
                        className="flex items-center justify-between rounded-2xl bg-[#FFF7CC]/60 px-3 py-3 text-sm font-semibold text-[var(--admin-title)] hover:bg-[#FFF7CC]"
                      >
                        <span>{t.label}</span>
                        <span className="admin-pill admin-pill-warning">{t.value}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="admin-surface-card rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]">
              <h2 className="mb-4 text-lg font-bold text-[var(--admin-title)]">最近操作／最新資料</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "區間營業額", value: formatCurrency(periodSales) },
                  { label: "今日商城訂單", value: stats?.todayMallOrders ?? 0 },
                  { label: "今日團購訂單", value: stats?.todayGroupBuyOrders ?? 0 },
                  { label: "進行中團購", value: stats?.activeGroupBuys ?? 0, href: "/admin/group-buy/products" },
                  { label: "低庫存", value: stats?.lowStockProducts ?? 0, href: "/admin/store/inventory?low=1" },
                  { label: "今日 App 毛利", value: formatCurrency(stats?.todayGrossProfit ?? 0) },
                ].map((item) =>
                  "href" in item && item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="rounded-2xl border border-[var(--admin-border)] bg-[#FFFDF6] p-4 transition hover:bg-[var(--admin-hover)]"
                    >
                      <p className="text-xs text-[var(--admin-muted)]">{item.label}</p>
                      <p className="mt-1 text-xl font-bold text-[var(--admin-title)]">{item.value}</p>
                    </Link>
                  ) : (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-[var(--admin-border)] bg-[#FFFDF6] p-4"
                    >
                      <p className="text-xs text-[var(--admin-muted)]">{item.label}</p>
                      <p className="mt-1 text-xl font-bold text-[var(--admin-title)]">{item.value}</p>
                    </div>
                  )
                )}
              </div>
              {(stats?.closingSoonProducts ?? []).length > 0 ? (
                <div className="mt-4 border-t border-[var(--admin-border)] pt-4">
                  <p className="mb-2 text-sm font-bold text-[var(--admin-title)]">今日即將收單</p>
                  <ul className="space-y-1">
                    {stats?.closingSoonProducts.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="text-sm font-semibold text-[var(--admin-title)] hover:underline"
                        >
                          {p.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="admin-surface-card rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--admin-title)]">快速建立</h2>
                <Bell className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_CREATE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="admin-lift flex flex-col items-start gap-3 rounded-[20px] border border-[var(--admin-border)] bg-[#FFFDF6] p-3 transition hover:bg-[var(--admin-hover)]"
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                      style={{ background: item.color, color: item.color === "#FFE149" ? "#153E73" : "#fff" }}
                    >
                      <item.Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-xs font-bold text-[var(--admin-title)]">{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="admin-surface-card rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]">
              <h2 className="mb-4 font-bold text-[var(--admin-title)]">App 營業額趨勢</h2>
              <AdminLineChart data={charts?.revenueTrend ?? []} />
            </div>
            <div className="admin-surface-card rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]">
              <h2 className="mb-4 font-bold text-[var(--admin-title)]">商品排行榜</h2>
              <AdminBarChart
                data={(charts?.topProducts ?? []).map((d, i) => ({
                  ...d,
                  color: ["#F16458", "#153E73", "#FFE149", "#43C47B", "#5CA8FF"][i],
                }))}
              />
            </div>
            <div className="admin-surface-card rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]">
              <h2 className="mb-4 font-bold text-[var(--admin-title)]">類別排行榜</h2>
              <AdminBarChart data={charts?.topCategories ?? []} />
            </div>
            <div className="admin-surface-card rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]">
              <h2 className="mb-4 font-bold text-[var(--admin-title)]">男女比例</h2>
              <AdminDonutChart segments={charts?.genderRatio ?? []} />
            </div>
            <div className="admin-surface-card rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]">
              <h2 className="mb-4 font-bold text-[var(--admin-title)]">縣市熱區</h2>
              <AdminBarChart
                data={(charts?.cityHotspots ?? []).map((d) => ({ ...d, color: "#153E73" }))}
              />
            </div>
            <div className="admin-surface-card rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]">
              <h2 className="mb-3 font-bold text-[var(--admin-title)]">內容與會員</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "已發布食譜", value: stats?.publishedRecipes ?? 0, href: "/admin/recipes" },
                  { label: "已發布影音", value: stats?.publishedVideos ?? 0, href: "/admin/videos" },
                  { label: "最新資訊", value: stats?.publishedNews ?? 0, href: "/admin/news" },
                  { label: "新增會員", value: stats?.newMembers ?? 0, href: "/admin/members" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-2xl bg-[#FFFDF6] p-3 transition hover:bg-[var(--admin-hover)]"
                  >
                    <p className="text-xs text-[var(--admin-muted)]">{item.label}</p>
                    <p className="mt-1 text-xl font-bold text-[var(--admin-title)]">{item.value}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
