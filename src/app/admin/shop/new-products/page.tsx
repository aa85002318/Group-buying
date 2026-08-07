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
  is_new?: boolean;
};

export default function AdminShopNewProductsPage() {
  const [products, setProducts] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/shop/new-products?limit=10", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setProducts(Array.isArray(d.products) ? d.products : []);
        setSource(String(d.source ?? ""));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="新品上架（自動）"
        description="依商城主分類排序自動撈取；優先 is_new 商品，不足時以各分類近期上架補足。請至商品主檔標記新品，並於「商品分類」調整主分類順序。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/shop?section=new" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
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

      <ShopCmsLiveSaveNotice section="new" />

      <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground shadow-card">
        <p>
          目前前台來源：<span className="font-semibold text-coffee">{source || "—"}</span>
          ，共 {products.length} 件。
        </p>
      </div>

      <AdminTable
        loading={loading}
        emptyText="尚無可預覽新品"
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
            key: "flag",
            header: "新品",
            render: (p) => (p.is_new ? "是" : "—"),
          },
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
