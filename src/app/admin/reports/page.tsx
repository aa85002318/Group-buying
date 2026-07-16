"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Product } from "@/lib/types/database";

const reports = [
  {
    title: "訂單報表",
    description: "匯出所有訂單明細（Excel）",
    href: "/api/admin/orders/export?format=xlsx",
  },
  {
    title: "分潤報表",
    description: "匯出分潤紀錄明細（Excel）",
    href: "/api/admin/commission-records/export?format=xlsx",
  },
];

export default function AdminReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

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
      <AdminPageHeader title="報表中心" description="下載營運、分潤與單一產品團購 Excel 報表" />

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.title}>
            <CardContent className="p-4">
              <h2 className="font-medium text-coffee">{r.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              <a href={r.href} className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
                下載 Excel →
              </a>
            </CardContent>
          </Card>
        ))}

        <Card className="md:col-span-2">
          <CardContent className="space-y-4 p-4">
            <div>
              <h2 className="font-medium text-coffee">單一產品團購報表</h2>
              <p className="mt-1 text-sm text-muted-foreground">依商品與時間區段匯出訂單明細（Excel）</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">商品</label>
                <select
                  className="input-field w-full"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">選擇商品</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">開始日期</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">結束日期</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            {productId ? (
              <a href={productExportHref}>
                <Button type="button">下載產品報表 Excel</Button>
              </a>
            ) : (
              <Button type="button" disabled>
                請先選擇商品
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
