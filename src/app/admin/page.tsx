"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

type DashboardStats = {
  todayOrders: number;
  todaySales: number;
  pendingPayment: number;
  paymentPendingConfirm: number;
  readyPickup: number;
  newMembers: number;
  shareOrders: number;
  pendingRewards: number;
  pendingCommissions: number;
  monthlyCommissionTotal: number;
  livestreamViews: number;
  videoViews: number;
};

const statCards: Array<{ key: keyof DashboardStats; label: string; href?: string; format?: "currency" }> = [
  { key: "todayOrders", label: "今日訂單" },
  { key: "todaySales", label: "今日銷售額", format: "currency" },
  { key: "pendingPayment", label: "待付款", href: "/admin/orders" },
  { key: "paymentPendingConfirm", label: "待確認付款", href: "/admin/payments" },
  { key: "readyPickup", label: "待取貨", href: "/admin/pickup" },
  { key: "newMembers", label: "今日新會員", href: "/admin/members" },
  { key: "shareOrders", label: "分享訂單", href: "/admin/share-tracking" },
  { key: "pendingRewards", label: "待審核獎勵", href: "/admin/rewards" },
  { key: "pendingCommissions", label: "待審核分潤", href: "/admin/commission-records" },
  { key: "monthlyCommissionTotal", label: "本月分潤總額", format: "currency", href: "/admin/commission-records" },
  { key: "livestreamViews", label: "直播觀看次數", href: "/admin/livestreams" },
  { key: "videoViews", label: "影音觀看次數", href: "/admin/videos" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="儀表板" description="即時營運數據總覽" />
      {loading ? (
        <p className="text-muted-foreground">載入中…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {statCards.map(({ key, label, href, format }) => {
            const value = stats?.[key] ?? 0;
            const display = format === "currency" ? formatCurrency(value) : value;
            const content = (
              <Card className={href ? "transition-shadow hover:shadow-md" : undefined}>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-primary mt-1">{display}</p>
                </CardContent>
              </Card>
            );
            return href ? (
              <Link key={key} href={href}>
                {content}
              </Link>
            ) : (
              <div key={key}>{content}</div>
            );
          })}
        </div>
      )}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-medium text-coffee mb-2">快速操作</h2>
          <ul className="text-sm space-y-1 text-coffee">
            <li>
              <Link href="/admin/payments" className="text-primary hover:underline">
                → 審核待確認付款回報
              </Link>
            </li>
            <li>
              <Link href="/admin/commission-records" className="text-primary hover:underline">
                → 處理待審核分潤紀錄
              </Link>
            </li>
            <li>
              <Link href="/admin/group-buy" className="text-primary hover:underline">
                → 管理團購活動
              </Link>
            </li>
            <li>
              <Link href="/admin/pickup" className="text-primary hover:underline">
                → 處理待取貨訂單
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
