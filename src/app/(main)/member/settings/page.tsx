import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bell, ChevronRight, Shield } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "CHIMEIDIY 帳號設定",
  description: "帳號與隱私、通知設定",
};

const SETTINGS = [
  {
    href: APP_ROUTES.memberAccountSettings,
    icon: Shield,
    label: "帳號與隱私",
    subtitle: "密碼、驗證與帳號刪除",
  },
  {
    href: APP_ROUTES.memberNotificationSettings,
    icon: Bell,
    label: "通知設定",
    subtitle: "訂單與活動通知偏好",
  },
] as const;

export default function MemberSettingsPage() {
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
          <h1 className="text-xl font-bold text-caramel">帳號設定</h1>
          <p className="text-sm text-foreground-secondary">管理帳號與通知偏好</p>
        </div>
      </div>

      <div className="divide-y overflow-hidden rounded-[20px] bg-surface shadow-card">
        {SETTINGS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-[56px] items-center gap-3 px-4 py-3 transition hover:bg-surface-soft"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-caramel">
              <item.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-medium text-foreground">{item.label}</span>
              <span className="block text-xs text-foreground-secondary">{item.subtitle}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-foreground-secondary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
