"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

export default function SupportOrdersPage() {
  return (
    <div className="space-y-4 pb-6">
      <Link href={APP_ROUTES.support} className="inline-flex items-center gap-2 text-caramel">
        <ArrowLeft className="h-4 w-4" /> 返回客服中心
      </Link>
      <h1 className="text-xl font-bold text-caramel">訂單問題</h1>
      <p className="text-sm text-foreground-secondary">
        僅協助 CHIMEIDIY App 建立的商城與團購訂單，不含門市 POS 現場消費。
      </p>
      <div className="space-y-2">
        <Link href={APP_ROUTES.memberOrders ?? "/member/orders"} className="block rounded-2xl bg-surface p-4 font-medium shadow-card">
          查看我的 App 訂單
        </Link>
        <Link href={`${APP_ROUTES.faq}?category=order`} className="block rounded-2xl bg-surface p-4 font-medium shadow-card">
          App 訂單 FAQ
        </Link>
        <Link href={APP_ROUTES.support} className="block rounded-2xl bg-surface p-4 font-medium shadow-card">
          填寫客服表單
        </Link>
      </div>
    </div>
  );
}
