"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, PackagePlus, Upload } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAdminList } from "@/hooks/useAdminList";
import { calcGrossMarginAmount } from "@/lib/admin/product-form-v2";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types/database";

export default function AdminProductsPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, loading } = useAdminList<Product>(
    "/api/admin/products",
    "products",
    ["name"]
  );
  const [stats, setStats] = useState({ total: 0, active: 0, lowStock: 0 });

  useEffect(() => {
    fetch("/api/admin/inventory?summary=true")
      .then((r) => r.json())
      .then((d) => setStats(d.summary ?? { total: 0, active: 0, lowStock: 0 }))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="商品管理"
        description="Shopify 風格商品中心：新增、匯入、分類與庫存管理"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/products/import">
              <Button variant="secondary">
                <Upload className="mr-1.5 h-4 w-4" />
                批次匯入
              </Button>
            </Link>
            <Link href="/admin/products/new">
              <Button className="bg-[#FF4F7B] hover:bg-[#E63D6A]">
                <PackagePlus className="mr-1.5 h-4 w-4" />
                新增商品
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "商品總數", value: stats.total },
          { label: "上架中", value: stats.active },
          { label: "低庫存警示", value: stats.lowStock },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[20px] border border-[#E8EBF4] bg-white p-5 shadow-[0_4px_24px_rgba(30,58,138,0.06)]"
          >
            <p className="text-sm text-[#64748B]">{item.label}</p>
            <p className="mt-1 text-3xl font-black text-[#1E3A8A]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/products/categories">
          <Button variant="outline" size="sm">分類管理</Button>
        </Link>
        <Link href="/admin/inventory">
          <Button variant="outline" size="sm">庫存報表</Button>
        </Link>
        <Link href="/admin/reports">
          <Button variant="outline" size="sm">銷售報表</Button>
        </Link>
      </div>

      <AdminTable
        columns={[
          {
            key: "name",
            header: "商品",
            render: (p) => (
              <div>
                <p className="font-semibold text-[#1E293B]">{p.name}</p>
                {(p as { sku?: string }).sku && (
                  <p className="text-xs text-[#94A3B8]">{(p as { sku?: string }).sku}</p>
                )}
              </div>
            ),
          },
          {
            key: "category",
            header: "分類",
            render: (p) => (p.product_categories as { name?: string } | undefined)?.name ?? "—",
          },
          {
            key: "price",
            header: "售價",
            render: (p) => formatCurrency(p.price),
          },
          { key: "stock", header: "庫存", render: (p) => p.stock },
          {
            key: "status",
            header: "狀態",
            render: (p) => {
              const status = p.status ?? (p.is_active ? "active" : "inactive");
              const labels: Record<string, string> = {
                active: "上架",
                inactive: "下架",
                draft: "草稿",
                sold_out: "售完",
              };
              const variants: Record<string, "success" | "secondary" | "primary"> = {
                active: "success",
                inactive: "secondary",
                draft: "primary",
                sold_out: "secondary",
              };
              return (
                <StatusBadge
                  label={labels[status] ?? status}
                  variant={variants[status] ?? "secondary"}
                />
              );
            },
          },
          {
            key: "margin",
            header: "毛利",
            render: (p) => {
              const m = calcGrossMarginAmount(String(p.price), String(p.cost_price ?? ""));
              return m != null ? formatCurrency(m) : "—";
            },
          },
          {
            key: "actions",
            header: "操作",
            render: (p) => (
              <div className="flex flex-wrap justify-end gap-1">
                <Link href={`/admin/products/${p.id}/analysis`}>
                  <Button size="sm" variant="outline">分析</Button>
                </Link>
                <Link href={`/admin/products/${p.id}/edit`}>
                  <Button size="sm" variant="secondary">編輯</Button>
                </Link>
              </div>
            ),
          },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋商品名稱、SKU…"
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <div className="rounded-[20px] border border-dashed border-[#E8EBF4] bg-[#F7F8FC] p-6 text-center">
        <Download className="mx-auto h-8 w-8 text-[#FF4F7B]" />
        <p className="mt-2 font-semibold text-[#334155]">需要批次新增商品？</p>
        <p className="mt-1 text-sm text-[#64748B]">下載 Excel / CSV 範例，一次匯入多筆商品資料</p>
        <Link href="/admin/products/import" className="mt-3 inline-block">
          <Button variant="secondary">前往批次匯入</Button>
        </Link>
      </div>
    </div>
  );
}
