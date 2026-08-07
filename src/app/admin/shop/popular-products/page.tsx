"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ShopCmsLiveSaveNotice } from "@/components/admin/shop/ShopCmsLiveSaveNotice";
import { AdminTable } from "@/components/admin/AdminTable";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreviewRow = {
  id: string;
  name: string;
  image_url?: string | null;
  price?: number | null;
  sale_price?: number | null;
  website_price?: number | null;
  category_id?: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  shop_home_sort_order?: number | null;
};

export default function AdminShopPopularProductsPage() {
  const [products, setProducts] = useState<PreviewRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/shop/popular-products?limit=10", { cache: "no-store" }).then((r) =>
        r.json()
      ),
      fetch("/api/admin/shop/categories").then((r) => r.json()),
    ])
      .then(([rail, cats]) => {
        setProducts(Array.isArray(rail.products) ? rail.products : []);
        setSource(String(rail.source ?? ""));
        const list = (cats.categories ?? []) as CategoryRow[];
        setCategories(
          list
            .filter((c) => (c as { show_on_shop_home?: boolean }).show_on_shop_home !== false)
            .sort(
              (a, b) =>
                Number(a.shop_home_sort_order ?? 100) -
                Number(b.shop_home_sort_order ?? 100)
            )
        );
      })
      .catch(() => {
        setProducts([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="熱門商品（自動）"
        description="依商城主分類排序自動撈取可售商品，同分類內依瀏覽／加購／收藏分數排序。請至「商品分類」調整主分類露出與順序。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/shop?section=popular" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              返回商城 CMS
            </Link>
            <Link
              href="/admin/shop/categories"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              管理主分類
            </Link>
            <Link href="/shop" className={cn(buttonVariants({ size: "sm" }))}>
              前台預覽
            </Link>
          </div>
        }
      />

      <ShopCmsLiveSaveNotice section="popular" />

      <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground shadow-card">
        <p>
          目前前台來源：<span className="font-semibold text-coffee">{source || "—"}</span>
          ，共 {products.length} 件。參與主分類 {categories.length} 個。
        </p>
      </div>

      <AdminTable
        loading={loading}
        emptyText="尚無可預覽商品（請確認主分類有對應商品）"
        columns={[
          {
            key: "img",
            header: "圖",
            render: (p) =>
              p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" className="h-12 w-12 rounded object-cover" />
              ) : (
                "—"
              ),
          },
          { key: "name", header: "商品", render: (p) => p.name },
          {
            key: "price",
            header: "售價",
            render: (p) => Number(p.sale_price ?? p.website_price ?? p.price ?? 0),
          },
        ]}
        rows={products}
      />
    </div>
  );
}
