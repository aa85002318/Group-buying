import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrdersClient } from "@/app/(main)/orders/OrdersClient";
import { APP_ROUTES } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "CHIMEIDIY 我的 App 訂單",
  description: "僅顯示透過 CHIMEIDIY App 建立的商城與團購訂單，不包含門市現場消費紀錄。",
};

export default function MemberOrdersPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-start gap-3">
        <Link
          href={APP_ROUTES.member}
          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface shadow-card"
          aria-label="返回會員中心"
        >
          <ArrowLeft className="h-5 w-5 text-caramel" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-caramel">我的 App 訂單</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            僅顯示透過 CHIMEIDIY App 建立的商城與團購訂單，不包含門市現場消費紀錄。
          </p>
          <p className="mt-1 text-xs text-foreground-secondary">此頁僅顯示 CHIMEIDIY App 訂單。</p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        }
      >
        <OrdersClient hideTitle appOrdersOnly />
      </Suspense>
    </div>
  );
}
