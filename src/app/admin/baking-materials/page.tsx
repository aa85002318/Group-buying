"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PackagePlus, Upload } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type BakingProduct = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  status: string;
  image_url: string | null;
  category_name: string | null;
  brand_name: string | null;
  variant_count: number;
  updated_at: string;
};

type BakingStats = {
  total: number;
  active: number;
  inactive: number;
  outOfStock: number;
  lowStock: number;
  categoryCount: number;
  brandCount: number;
};

type FilterOption = { id: string; name: string };

const STATUS_FILTERS = [
  { value: "", label: "全部狀態" },
  { value: "active", label: "上架中" },
  { value: "inactive", label: "下架/草稿" },
  { value: "out_of_stock", label: "缺貨" },
  { value: "low_stock", label: "低庫存" },
];

export default function AdminBakingMaterialsPage() {
  const [products, setProducts] = useState<BakingProduct[]>([]);
  const [stats, setStats] = useState<BakingStats>({
    total: 0,
    active: 0,
    inactive: 0,
    outOfStock: 0,
    lowStock: 0,
    categoryCount: 0,
    brandCount: 0,
  });
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [brands, setBrands] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search.trim()) params.set("q", search.trim());
      if (category) params.set("category", category);
      if (brand) params.set("brand", brand);
      if (status) params.set("status", status);

      const res = await fetch(`/api/admin/baking-materials?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");

      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
      if (data.stats) setStats(data.stats);
      setCategories(data.categories ?? []);
      setBrands(data.brands ?? []);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, brand, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, category, brand, status]);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      active: "上架",
      inactive: "下架",
      draft: "草稿",
      sold_out: "售完",
    };
    return map[s] ?? s;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="烘焙材料"
        description="烘焙材料目錄商品：原料、器具、包裝"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/product-imports">
              <Button variant="secondary">
                <Upload className="mr-1.5 h-4 w-4" />
                批次匯入
              </Button>
            </Link>
            <Link href="/admin/products/new">
              <Button className="bg-primary hover:bg-[#E63D6A]">
                <PackagePlus className="mr-1.5 h-4 w-4" />
                新增商品
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {[
          { label: "商品總數", value: stats.total },
          { label: "上架中", value: stats.active },
          { label: "下架/草稿", value: stats.inactive },
          { label: "缺貨", value: stats.outOfStock },
          { label: "低庫存", value: stats.lowStock },
          { label: "分類數", value: stats.categoryCount },
          { label: "品牌數", value: stats.brandCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[20px] border border-border bg-white p-4 shadow-card"
          >
            <p className="text-xs text-foreground-secondary">{item.label}</p>
            <p className="mt-1 text-2xl font-black text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <AdminTable
        loading={loading}
        emptyText="尚無烘焙材料商品"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋名稱或 SKU…"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        toolbar={
          <>
            <select
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">全部分類</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              <option value="">全部品牌</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" disabled title="即將推出">
              批次操作
            </Button>
          </>
        }
        columns={[
          {
            key: "select",
            header: "",
            className: "w-8",
            render: () => (
              <input type="checkbox" disabled aria-label="選取" className="opacity-40" />
            ),
          },
          {
            key: "image",
            header: "圖片",
            render: (p) =>
              p.image_url ? (
                <Image
                  src={p.image_url}
                  alt={p.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                  —
                </div>
              ),
          },
          {
            key: "name",
            header: "名稱",
            render: (p) => (
              <div>
                <p className="font-semibold text-foreground">{p.name}</p>
                {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
              </div>
            ),
          },
          { key: "category", header: "分類", render: (p) => p.category_name ?? "—" },
          { key: "brand", header: "品牌", render: (p) => p.brand_name ?? "—" },
          { key: "price", header: "售價", render: (p) => formatCurrency(p.price) },
          { key: "variants", header: "規格數", render: (p) => p.variant_count },
          { key: "stock", header: "庫存", render: (p) => p.stock },
          {
            key: "status",
            header: "狀態",
            render: (p) => (
              <StatusBadge
                label={statusLabel(p.status)}
                variant={p.status === "active" ? "success" : "secondary"}
              />
            ),
          },
          {
            key: "updated",
            header: "更新時間",
            render: (p) =>
              p.updated_at ? new Date(p.updated_at).toLocaleDateString("zh-TW") : "—",
          },
          {
            key: "actions",
            header: "",
            render: (p) => (
              <Link href={`/admin/products/${p.id}/edit`}>
                <Button size="sm" variant="ghost">
                  編輯
                </Button>
              </Link>
            ),
          },
        ]}
        rows={products}
      />
    </div>
  );
}
