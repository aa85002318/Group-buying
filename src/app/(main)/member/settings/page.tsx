import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Download,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  Smartphone,
  Store,
  UserRound,
  FileText,
  Mail,
} from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "CHIMEIDIY 帳號設定",
  description: "帳號、隱私與安全設定",
};

const SETTINGS = [
  {
    href: APP_ROUTES.memberProfile,
    icon: UserRound,
    label: "會員資料",
    subtitle: "姓名、生日與聯絡地址",
  },
  {
    href: APP_ROUTES.memberAccountSettings,
    icon: Shield,
    label: "帳號與安全",
    subtitle: "密碼、Email 驗證、刪除帳號",
  },
  {
    href: APP_ROUTES.memberPhoneChange,
    icon: Phone,
    label: "變更手機",
    subtitle: "重複檢查與 Email 驗證碼",
  },
  {
    href: APP_ROUTES.memberAddresses,
    icon: MapPin,
    label: "常用收件地址",
    subtitle: "宅配收件人與預設地址",
  },
  {
    href: APP_ROUTES.memberPreferredStore,
    icon: Store,
    label: "預設取貨門市",
    subtitle: "偏好門市取貨設定",
  },
  {
    href: APP_ROUTES.memberLineSettings,
    icon: MessageCircle,
    label: "LINE 綁定",
    subtitle: "綁定或解除 LINE 帳號",
  },
  {
    href: APP_ROUTES.memberNotificationSettings,
    icon: Bell,
    label: "通知設定",
    subtitle: "訂單與活動通知偏好",
  },
  {
    href: APP_ROUTES.memberSubscriptions,
    icon: Mail,
    label: "行銷訊息同意",
    subtitle: "Email／LINE／簡訊行銷偏好",
  },
  {
    href: APP_ROUTES.memberPrivacyConsents,
    icon: FileText,
    label: "隱私權與條款同意紀錄",
    subtitle: "查閱同意時間與版本",
  },
  {
    href: APP_ROUTES.memberDataExport,
    icon: Download,
    label: "個資下載／查詢",
    subtitle: "匯出個人資料副本",
  },
  {
    href: APP_ROUTES.memberLoginDevices,
    icon: Smartphone,
    label: "登入裝置",
    subtitle: "裝置紀錄與異常登入保護",
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
          <p className="text-sm text-foreground-secondary">管理帳號、隱私與安全</p>
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
