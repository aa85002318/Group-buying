import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Gift } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "CHIMEIDIY 會員福利",
  description: "查看管理員或 App 活動發放的會員福利（不含門市 POS 消費累計）。",
};

export default function MemberBenefitsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={APP_ROUTES.member}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface shadow-card"
          aria-label="返回會員中心"
        >
          <ArrowLeft className="h-5 w-5 text-caramel" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-caramel">會員福利</h1>
          <p className="text-sm text-foreground-secondary">僅顯示 App 活動發放的福利</p>
        </div>
      </div>

      <div className="rounded-[20px] bg-surface p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-butter-soft text-caramel">
          <Gift className="h-7 w-7" />
        </span>
        <p className="mt-4 font-bold text-foreground">目前尚無福利紀錄</p>
        <p className="mt-2 text-sm text-foreground-secondary">
          福利僅來自管理員手動發放或 App／團購／課程活動，不會依門市 POS 消費金額自動發放。
        </p>
        <p className="mt-3 text-xs text-foreground-secondary">
          本階段不提供點數、會員等級、VIP 或優惠券錢包。
        </p>
      </div>

      <section className="rounded-[20px] border border-border bg-peach-soft/40 p-4 text-sm text-foreground-secondary">
        <p className="font-medium text-caramel">說明</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>線上 App 會員與門市會員資料不會自動合併。</li>
          <li>門市消費累計、發票金額不會出現在此頁。</li>
        </ul>
      </section>
    </div>
  );
}
