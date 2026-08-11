"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Download, PackagePlus, Printer, Upload } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAdminShell } from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminList";
import { calcGrossMarginAmount } from "@/lib/admin/product-form-v2";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types/database";

export default function AdminProductsPage() {
  const { profile } = useAdminShell();
  const isAdmin = profile?.role === "admin";
  const { paginated, search, setSearch, page, setPage, totalPages, loading, error } = useAdminList<Product>(
    "/api/admin/products",
    "products",
    ["name", "sku"]
  );
  const [stats, setStats] = useState({ total: 0, active: 0, lowStock: 0 });

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/inventory?summary=true")
      .then((r) => r.json())
      .then((d) => setStats(d.summary ?? { total: 0, active: 0, lowStock: 0 }))
      .catch(() => {});
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="商品主檔"
        description={
          isAdmin
            ? "Product Master：商品只建立一次，透過渠道上架官網／團購／門市"
            : "瀏覽商品主檔與列印價格牌。新增／編輯請由總部管理員操作。"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {isAdmin ? (
              <>
                <Link href="/admin/products/analysis">
                  <Button variant="secondary">
                    <BarChart3 className="mr-1.5 h-4 w-4" />
                    分析總覽
                  </Button>
                </Link>
                <Link href="/admin/products/labels">
                  <Button variant="secondary">
                    <Printer className="mr-1.5 h-4 w-4" />
                    價格牌列印
                  </Button>
                </Link>
                <Link href="/admin/products/import">
                  <Button variant="secondary">
                    <Upload className="mr-1.5 h-4 w-4" />
                    批次匯入
                  </Button>
                </Link>
                <Link href="/admin/products/new">
                  <Button variant="secondary">
                    <PackagePlus className="mr-1.5 h-4 w-4" />
                    商品新增
                  </Button>
                </Link>
                <Link href="/admin/products/new?mode=group-buy">
                  <Button className="bg-primary hover:bg-[#E63D6A]">
                    <PackagePlus className="mr-1.5 h-4 w-4" />
                    團購新增
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/admin/products/labels">
                <Button variant="secondary">
                  <Printer className="mr-1.5 h-4 w-4" />
                  價格牌列印
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {isAdmin ? (
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "商品總數", value: stats.total },
          { label: "上架中", value: stats.active },
          { label: "低庫存警示", value: stats.lowStock },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[20px] border border-border bg-white p-5 shadow-card"
          >
            <p className="text-sm text-foreground-secondary">{item.label}</p>
            <p className="mt-1 text-3xl font-black text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {isAdmin ? (
          <>
            <Link href="/admin/products/categories">
              <Button variant="outline" size="sm">分類管理</Button>
            </Link>
            <Link href="/admin/inventory">
              <Button variant="outline" size="sm">庫存報表</Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" size="sm">銷售報表</Button>
            </Link>
          </>
        ) : null}
        <Link href="/admin/store">
          <Button variant="outline" size="sm">門市協作中心</Button>
        </Link>
        <Link href="/admin/store/inventory">
          <Button variant="outline" size="sm">分店庫存查詢</Button>
        </Link>
      </div>

      {error ? (
        <p className="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          商品列表載入失敗：{error}
        </p>
      ) : null}

      <AdminTable>
        columns={[
          {
            key: "name",
            header: "商品",
            render: (p) => (
              <div>
                <p className="font-semibold text-foreground">{p.name}</p>
                {(p as { sku?: string }).sku && (
                  <p className="text-xs text-foreground-muted">{(p as { sku?: string }).sku}</p>
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
                <Link href={`/admin/products/labels?productId=${p.id}`}>
                  <Button size="sm" variant="outline">價格牌</Button>
                </Link>
                {isAdmin ? (
                  <>
                    <Link href={`/admin/products/${p.id}/analysis`}>
                      <Button size="sm" variant="outline">分析</Button>
                    </Link>
                    <Link href={`/admin/products/${p.id}/edit`}>
                      <Button size="sm" variant="secondary">編輯</Button>
                    </Link>
                  </>
                ) : null}
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

      {isAdmin ? (
      <div className="rounded-[20px] border border-dashed border-border bg-background p-6 text-center">
        <Download className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-2 font-semibold text-[#334155]">需要批次新增商品？</p>
        <p className="mt-1 text-sm text-foreground-secondary">下載 Excel / CSV 範例，一次匯入多筆商品資料</p>
        <Link href="/admin/products/import" className="mt-3 inline-block">
          <Button variant="secondary">前往批次匯入</Button>
        </Link>
      </div>
      ) : null}
    </div>
  );
}
