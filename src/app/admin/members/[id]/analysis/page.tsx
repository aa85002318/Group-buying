"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, UserRound } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/v2/AdminCard";
import { AdminBarChart, AdminDonutChart, AdminLineChart } from "@/components/admin/v2/AdminCharts";
import { Button } from "@/components/ui/button";
import { formatCurrency, ROLE_LABELS } from "@/lib/utils";

type MemberAnalysisResponse = {
  profile: { id: string; full_name: string | null; email: string | null; role: string; birthday: string | null };
  summary: {
    gender: string;
    ageGroup: string;
    city: string;
    district: string;
    memberLevel: string;
    totalSpent: number;
    purchaseCount: number;
    avgOrderValue: number;
    pendingOrders: number;
  };
  topProducts: Array<{ label: string; value: number }>;
  orderTrend: Array<{ label: string; value: number }>;
  orderStatuses: Array<{ label: string; value: number; color: string }>;
};

export default function AdminMemberAnalysisPage() {
  const params = useParams();
  const memberId = params.id as string;
  const [data, setData] = useState<MemberAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/members/${memberId}/analysis`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) return <p className="text-[#64748B]">載入中…</p>;
  if (!data) return <p className="text-red-600">無法載入會員分析</p>;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`客戶分析：${data.profile.full_name ?? data.profile.email ?? "會員"}`}
        description={`角色：${ROLE_LABELS[data.profile.role] ?? data.profile.role}`}
        actions={
          <Link href="/admin/members">
            <Button variant="outline">
              <ArrowLeft className="mr-1.5 h-4 w-4" />返回會員列表
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "累積消費", value: formatCurrency(data.summary.totalSpent) },
          { label: "購買次數", value: data.summary.purchaseCount },
          { label: "平均客單價", value: formatCurrency(data.summary.avgOrderValue) },
          { label: "待處理訂單", value: data.summary.pendingOrders },
        ].map((item) => (
          <div key={item.label} className="rounded-[20px] border border-[#E8EBF4] bg-white p-5 shadow-[0_4px_24px_rgba(30,58,138,0.06)]">
            <p className="text-sm text-[#64748B]">{item.label}</p>
            <p className="mt-1 text-2xl font-black text-[#1E3A8A]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="客戶輪廓" description="性別、年齡層、地區與會員等級" icon={<UserRound className="h-5 w-5" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#F7F8FC] p-4"><p className="text-xs text-[#64748B]">性別</p><p className="mt-1 font-bold text-[#1E293B]">{data.summary.gender}</p></div>
            <div className="rounded-2xl bg-[#F7F8FC] p-4"><p className="text-xs text-[#64748B]">年齡層</p><p className="mt-1 font-bold text-[#1E293B]">{data.summary.ageGroup}</p></div>
            <div className="rounded-2xl bg-[#F7F8FC] p-4"><p className="text-xs text-[#64748B]">縣市</p><p className="mt-1 font-bold text-[#1E293B]">{data.summary.city}</p></div>
            <div className="rounded-2xl bg-[#F7F8FC] p-4"><p className="text-xs text-[#64748B]">行政區</p><p className="mt-1 font-bold text-[#1E293B]">{data.summary.district}</p></div>
            <div className="rounded-2xl bg-[#F7F8FC] p-4 sm:col-span-2"><p className="text-xs text-[#64748B]">會員等級</p><p className="mt-1 font-bold text-[#1E293B]">{data.summary.memberLevel}</p></div>
          </div>
        </AdminCard>

        <AdminCard title="訂單狀態分布" description="付款與完成狀態概況" icon={<MapPin className="h-5 w-5" />}>
          <AdminDonutChart segments={data.orderStatuses} />
        </AdminCard>

        <AdminCard title="消費趨勢" description="近期待付與消費變化" icon={<MapPin className="h-5 w-5" />}>
          <AdminLineChart data={data.orderTrend} height={180} color="#1E3A8A" />
        </AdminCard>

        <AdminCard title="熱門商品" description="此會員最常購買的商品" icon={<UserRound className="h-5 w-5" />}>
          <AdminBarChart
            data={data.topProducts.map((item, index) => ({
              ...item,
              color: ["#FF4F7B", "#1E3A8A", "#FFC400", "#23B26D", "#A93DDB"][index % 5],
            }))}
            height={180}
          />
        </AdminCard>
      </div>
    </div>
  );
}
