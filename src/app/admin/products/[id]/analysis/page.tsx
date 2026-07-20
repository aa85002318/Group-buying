"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart3, Eye, Heart, ShoppingCart } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/v2/AdminCard";
import { AdminBarChart, AdminLineChart } from "@/components/admin/v2/AdminCharts";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type AnalysisResponse = {
  product: { id: string; name: string; price: number; cost_price?: number | null };
  summary: {
    soldQuantity: number;
    revenue: number;
    averagePrice: number;
    grossProfit: number;
    returnRate: number;
    favoriteCount: number;
    viewCount: number;
    cartAddRate: number;
    conversionRate: number;
  };
  trend: Array<{ label: string; value: number }>;
  sources: { videos: number; activeOrders: number };
};

export default function AdminProductAnalysisPage() {
  const params = useParams();
  const productId = params.id as string;
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/products/${productId}/analysis`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <p className="text-foreground-secondary">載入中…</p>;
  if (!data) return <p className="text-red-600">無法載入單品分析</p>;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`單品分析：${data.product.name}`}
        description="售出數量、營業額、毛利、收藏數、瀏覽數與轉換表現"
        actions={
          <div className="flex gap-2">
            <Link href={`/admin/products/${productId}/edit`}>
              <Button variant="outline">編輯商品</Button>
            </Link>
            <Link href="/admin/products">
              <Button variant="outline">
                <ArrowLeft className="mr-1.5 h-4 w-4" />返回列表
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "售出數量", value: data.summary.soldQuantity },
          { label: "營業額", value: formatCurrency(data.summary.revenue) },
          { label: "平均售價", value: formatCurrency(data.summary.averagePrice) },
          { label: "毛利", value: formatCurrency(data.summary.grossProfit) },
          { label: "退貨率", value: `${data.summary.returnRate.toFixed(1)}%` },
          { label: "加入購物車率", value: `${data.summary.cartAddRate.toFixed(1)}%` },
          { label: "轉換率", value: `${data.summary.conversionRate.toFixed(1)}%` },
          { label: "有效訂單", value: data.sources.activeOrders },
        ].map((item) => (
          <div key={item.label} className="rounded-[20px] border border-border bg-white p-5 shadow-card">
            <p className="text-sm text-foreground-secondary">{item.label}</p>
            <p className="mt-1 text-2xl font-black text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="營收趨勢" description="最近 7-30 天單品營收" icon={<BarChart3 className="h-5 w-5" />}>
          <AdminLineChart data={data.trend} height={180} />
        </AdminCard>
        <AdminCard title="流量與互動" description="瀏覽、收藏、影片關聯" icon={<Eye className="h-5 w-5" />}>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-background p-4">
              <div className="flex items-center gap-2 text-foreground-secondary"><Eye className="h-4 w-4" />瀏覽數</div>
              <p className="mt-2 text-2xl font-black text-foreground">{data.summary.viewCount}</p>
            </div>
            <div className="rounded-2xl bg-background p-4">
              <div className="flex items-center gap-2 text-foreground-secondary"><Heart className="h-4 w-4" />收藏數</div>
              <p className="mt-2 text-2xl font-black text-foreground">{data.summary.favoriteCount}</p>
            </div>
            <div className="rounded-2xl bg-background p-4">
              <div className="flex items-center gap-2 text-foreground-secondary"><ShoppingCart className="h-4 w-4" />影片關聯</div>
              <p className="mt-2 text-2xl font-black text-foreground">{data.sources.videos}</p>
            </div>
          </div>
          <div className="mt-5">
            <AdminBarChart
              data={[
                { label: "瀏覽", value: data.summary.viewCount, color: "#5C4033" },
                { label: "收藏", value: data.summary.favoriteCount, color: "#FF6B6B" },
                { label: "售出", value: data.summary.soldQuantity, color: "#23B26D" },
              ]}
              height={180}
            />
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
