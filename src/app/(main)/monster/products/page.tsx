"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import type { ShareableProduct } from "@/lib/types/database";

const STATUS_LABELS: Record<string, string> = {
  available: "可分享",
  pending_review: "審核中",
  approved: "已通過",
  rejected: "已拒絕",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "default",
  pending_review: "secondary",
  approved: "outline",
  rejected: "destructive",
};

export default function MonsterProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ShareableProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) router.push("/auth/login");
      });
    }

    fetch("/api/monster/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">載入中…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/monster" className="text-sm text-[#C94C4C]">← 返回小怪獸</Link>
        <h1 className="text-xl font-bold text-[#333333] mt-1">選擇要分享的商品</h1>
        <p className="text-sm text-[#8A8A8A]">僅限已付款／完成的訂單商品</p>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-4xl">🍞</p>
            <p className="font-medium text-[#333333]">尚無可分享的商品</p>
            <p className="text-sm text-[#8A8A8A]">
              完成訂單付款後，即可回來餵養麵包小怪獸！
            </p>
            <Link
              href="/orders"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
            >
              查看我的訂單
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={`${p.order_id}-${p.product_id}`}>
              <CardContent className="flex gap-3 p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#FFF8F5]">
                  {p.image_url ? (
                    <Image src={p.image_url} alt={p.product_name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{p.product_name}</p>
                  <p className="text-xs text-[#8A8A8A]">訂單 {p.order_number}</p>
                  <Badge
                    variant={STATUS_VARIANT[p.share_status] ?? "secondary"}
                    className="mt-1"
                  >
                    {STATUS_LABELS[p.share_status] ?? p.share_status}
                  </Badge>
                </div>
                {p.share_status === "available" && (
                  <Link
                    href={`/monster/share/${p.product_id}?orderId=${p.order_id}`}
                    className="inline-flex h-8 shrink-0 items-center self-center justify-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary-dark"
                  >
                    分享
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
