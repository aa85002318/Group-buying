"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PopularProductRow = {
  id: string;
  name: string;
  image_url?: string | null;
  price?: number | null;
  sale_price?: number | null;
  website_price?: number | null;
  is_popular?: boolean;
  popular_sort_order?: number | null;
  package_spec?: string | null;
  unit?: string | null;
  brands?: { name?: string | null } | null;
};

export default function AdminShopPopularProductsPage() {
  const [products, setProducts] = useState<PopularProductRow[]>([]);
  const [candidates, setCandidates] = useState<PopularProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/shop/popular-products")
      .then((r) => r.json())
      .then((d) => {
        setProducts(Array.isArray(d.products) ? d.products : []);
        setCandidates(Array.isArray(d.candidates) ? d.candidates : []);
      })
      .catch(() => {
        setProducts([]);
        setCandidates([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/shop/popular-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "更新失敗");
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新失敗");
    } finally {
      setBusyId(null);
    }
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = products.findIndex((p) => p.id === id);
    const swap = products[idx + dir];
    if (!swap) return;
    const ordered = [...products];
    ordered[idx] = swap;
    ordered[idx + dir] = products[idx];
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/shop/popular-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordered_ids: ordered.map((p) => p.id) }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "排序失敗");
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "排序失敗");
    } finally {
      setBusyId(null);
    }
  };

  const filteredCandidates = candidates.filter((p) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return p.name.toLowerCase().includes(needle);
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="商城熱門商品"
        description="優先顯示人工精選（is_popular），再依加購／瀏覽自動補足。最多前台顯示 10 項。"
        actions={
          <Link href="/admin/shop" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            返回商城 CMS
          </Link>
        }
      />

      <AdminTable
        loading={loading}
        emptyText="尚未設定熱門商品"
        columns={[
          {
            key: "product",
            header: "商品",
            render: (p) => (
              <div className="flex items-center gap-2">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-surface-soft text-[10px] text-muted-foreground">
                    無圖
                  </span>
                )}
                <div>
                  <p className="font-medium text-coffee">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.brands?.name || p.package_spec || p.unit || "—"}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "sort",
            header: "排序",
            render: (p) => p.popular_sort_order ?? 0,
          },
          {
            key: "actions",
            header: "操作",
            render: (p) => (
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === p.id}
                  onClick={() => void move(p.id, -1)}
                >
                  上移
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === p.id}
                  onClick={() => void move(p.id, 1)}
                >
                  下移
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId === p.id}
                  onClick={() => void patch(p.id, { is_popular: false })}
                >
                  移除熱門
                </Button>
              </div>
            ),
          },
        ]}
        rows={products}
      />

      <div className="rounded-xl border border-border bg-white p-4 shadow-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-coffee">快速加入熱門商品</h2>
          <Input
            className="max-w-xs"
            placeholder="搜尋商品名稱"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCandidates.slice(0, 12).map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-lg border border-[#EEEEEE] p-2"
            >
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_url}
                  alt=""
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <span className="inline-flex h-12 w-12 items-center justify-center rounded bg-surface-soft text-[10px]">
                  無圖
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-coffee">{p.name}</p>
              </div>
              <Button
                size="sm"
                disabled={busyId === p.id}
                onClick={() =>
                  void patch(p.id, {
                    is_popular: true,
                    popular_sort_order: (products.at(-1)?.popular_sort_order ?? 0) + 10,
                  })
                }
              >
                加入
              </Button>
            </div>
          ))}
          {!filteredCandidates.length ? (
            <p className="text-sm text-muted-foreground">沒有可加入的商品</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
