"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BarChart3, Download, Images, PackagePlus, Printer, Upload } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAdminShell } from "@/components/admin/AdminShell";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ProductBatchDrawer } from "@/components/admin/products/ProductBatchDrawer";
import { calcGrossMarginAmount } from "@/lib/admin/product-form-v2";
import { formatCurrency } from "@/lib/utils";
import type { Product, ProductCategory } from "@/lib/types/database";

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[#8A94A6]">載入中…</p>}>
      <AdminProductsPageInner />
    </Suspense>
  );
}

function AdminProductsPageInner() {
  const { profile } = useAdminShell();
  const isAdmin = profile?.role === "admin";
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") ?? searchParams.get("search") ?? "";

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [stats, setStats] = useState({ total: 0, active: 0, lowStock: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [missingImage, setMissingImage] = useState(false);
  const [missingSubtitle, setMissingSubtitle] = useState(false);
  const [shipFilter, setShipFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const q = debouncedSearch.trim();
      if (q) params.set("search", q);
      const res = await fetch(`/api/admin/products${params.size ? `?${params}` : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setItems((data.products ?? []) as Product[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    statusFilter,
    categoryFilter,
    missingImage,
    missingSubtitle,
    shipFilter,
    priceMin,
    priceMax,
    pageSize,
  ]);

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/inventory?summary=true")
      .then((r) => r.json())
      .then((d) => setStats(d.summary ?? { total: 0, active: 0, lowStock: 0 }))
      .catch(() => {});
  }, [isAdmin]);

  const removeProduct = async (product: Product) => {
    if (!confirm(`確定刪除「${product.name}」？此操作無法復原。`)) return;
    setDeletingId(product.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "刪除失敗");
      await refresh();
      if (isAdmin) {
        const summaryRes = await fetch("/api/admin/inventory?summary=true");
        const summaryData = await summaryRes.json();
        setStats(summaryData.summary ?? { total: 0, active: 0, lowStock: 0 });
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "刪除失敗");
    } finally {
      setDeletingId(null);
    }
  };

  const extraFiltered = useMemo(() => {
    return items.filter((p) => {
      if (statusFilter) {
        const status = p.status ?? (p.is_active ? "active" : "inactive");
        if (status !== statusFilter) return false;
      }
      if (categoryFilter) {
        const ids = ((p as { category_ids?: string[] }).category_ids ?? []).concat(p.category_id ? [p.category_id] : []);
        if (!ids.includes(categoryFilter)) return false;
      }
      if (missingImage && p.image_url) return false;
      if (missingSubtitle && (p.subtitle ?? "").trim()) return false;
      if (shipFilter) {
        const flags = p as unknown as Record<string, unknown>;
        if (!flags[shipFilter]) return false;
      }
      const min = priceMin ? Number(priceMin) : null;
      const max = priceMax ? Number(priceMax) : null;
      if (min != null && !Number.isNaN(min) && p.price < min) return false;
      if (max != null && !Number.isNaN(max) && p.price > max) return false;
      return true;
    });
  }, [items, statusFilter, categoryFilter, missingImage, missingSubtitle, shipFilter, priceMin, priceMax]);

  const totalPages = Math.max(1, Math.ceil(extraFiltered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = extraFiltered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const pageIds = paginated.map((p) => p.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };
  const selectFiltered = () => setSelected(new Set(extraFiltered.map((p) => p.id)));
  const clearSelected = () => setSelected(new Set());

  const quickStatus = async (status: "active" | "inactive" | "draft") => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const res = await fetch("/api/admin/products/batch/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productIds: ids,
        runMode: "skip_errors",
        patch: { status: { enabled: true, value: status } },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setActionError(data.error ?? "批次狀態更新失敗");
      return;
    }
    clearSelected();
    await refresh();
  };

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
                <Link href="/admin/products/images/batch">
                  <Button variant="secondary">
                    <Images className="mr-1.5 h-4 w-4" />
                    商品圖片批次上傳
                  </Button>
                </Link>
                <Link href="/admin/products/batch-history">
                  <Button variant="secondary">操作紀錄</Button>
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

      <div className="flex flex-wrap items-center gap-2">
        <p className="w-full text-sm text-[#667085] sm:w-auto sm:mr-2">
          目前篩選結果 <span className="font-semibold text-[#153E73]">{extraFiltered.length}</span> 筆
          {items.length !== extraFiltered.length ? (
            <span className="text-[#8A94A6]">（已載入 {items.length}）</span>
          ) : null}
        </p>
        <select className="input-field h-10 w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全部狀態</option>
          <option value="active">上架</option>
          <option value="inactive">下架</option>
          <option value="draft">草稿</option>
        </select>
        <select className="input-field h-10 w-auto max-w-[200px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">全部分類</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={missingImage} onChange={(e) => setMissingImage(e.target.checked)} />
          缺少首圖
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={missingSubtitle} onChange={(e) => setMissingSubtitle(e.target.checked)} />
          缺少副標
        </label>
        <select className="input-field h-10 w-auto" value={shipFilter} onChange={(e) => setShipFilter(e.target.value)}>
          <option value="">全部配送</option>
          <option value="temp_ambient">常溫宅配</option>
          <option value="temp_chilled">冷藏宅配</option>
          <option value="temp_frozen">冷凍宅配</option>
          <option value="ship_store_pickup">門市取貨</option>
        </select>
        <input className="input-field h-10 w-24" type="number" placeholder="最低價" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
        <input className="input-field h-10 w-24" type="number" placeholder="最高價" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
        {isAdmin ? (
          <>
            <Button size="sm" variant="outline" onClick={togglePage}>選取本頁全部</Button>
            <Button size="sm" variant="outline" onClick={selectFiltered}>選取目前篩選結果全部</Button>
          </>
        ) : null}
      </div>

      {isAdmin && selected.size > 0 ? (
        <div className="sticky top-2 z-30 flex flex-wrap items-center gap-2 rounded-2xl border border-[#FFD454] bg-[#FFF5CC] p-3 shadow-sm max-md:fixed max-md:inset-x-3 max-md:bottom-16 max-md:top-auto">
          <span className="text-sm font-bold text-[#153E73]">已選取 {selected.size} 件商品</span>
          <Button size="sm" onClick={() => setDrawerOpen(true)}>批次編輯</Button>
          <Link href={`/admin/products/content-batch?ids=${Array.from(selected).join(",")}`}>
            <Button size="sm" variant="secondary">批次編輯內容</Button>
          </Link>
          <Link href={`/admin/products/price-batch?ids=${Array.from(selected).join(",")}`}>
            <Button size="sm" variant="secondary">價格批次更改</Button>
          </Link>
          <Button size="sm" variant="secondary" onClick={() => void quickStatus("active")}>上架</Button>
          <Button size="sm" variant="secondary" onClick={() => void quickStatus("inactive")}>下架</Button>
          <Button size="sm" variant="secondary" onClick={() => void quickStatus("draft")}>改為草稿</Button>
          <Link href="/admin/products/images/batch">
            <Button size="sm" variant="outline">批次圖片</Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={clearSelected}>清除選取</Button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          商品列表載入失敗：{error}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      <AdminTable
        columns={[
          {
            key: "select",
            header: "選取",
            render: (p) => (
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label="選取商品" />
            ),
          },
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      disabled={deletingId === p.id}
                      onClick={() => void removeProduct(p)}
                    >
                      {deletingId === p.id ? "刪除中…" : "刪除"}
                    </Button>
                  </>
                ) : null}
              </div>
            ),
          },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋名稱、SKU、條碼、副標、供應商…"
        loading={loading}
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={setPageSize}
        totalCount={extraFiltered.length}
        getRowClassName={(p) => (selected.has(p.id) ? "bg-[#FFF5CC]" : "")}
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
      {isAdmin ? (
        <ProductBatchDrawer
          open={drawerOpen}
          selectedCount={selected.size}
          productIds={Array.from(selected)}
          categories={categories}
          onClose={() => setDrawerOpen(false)}
          onDone={() => {
            setDrawerOpen(false);
            clearSelected();
            void refresh();
          }}
        />
      ) : null}
    </div>
  );
}
