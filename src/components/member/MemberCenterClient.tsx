"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Barcode,
  Bell,
  ChevronRight,
  FileText,
  Gift,
  Headphones,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  QrCode,
  Radio,
  Settings,
  Shield,
  Store,
  User,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmailVerificationNotice } from "@/components/auth/EmailVerificationNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { getAuthErrorMessage } from "@/lib/auth/error-messages";
import { requestVerificationEmail } from "@/lib/auth/send-verification-client";
import { maskPhone } from "@/lib/services/profileService";
import { APP_ROUTES } from "@/lib/site-links";

type Summary = {
  awaitingPayment: number;
  readyForPickup: number;
  completed: number;
  total: number;
  unreadNotifications: number;
  hasCarrier: boolean;
};

type ProfileSummary = {
  full_name?: string;
  email?: string;
  phone?: string;
  member_number?: string;
  member_code?: string;
};

function MenuLink({
  href,
  icon: Icon,
  label,
  subtitle,
  badge,
  featured,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subtitle?: string;
  badge?: number;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-[56px] items-center gap-3 px-4 py-3 transition hover:bg-surface-soft ${
        featured ? "bg-gradient-to-r from-primary-soft to-white" : ""
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${featured ? "bg-primary/10 text-primary" : "bg-surface-soft text-caramel"}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-medium text-foreground">{label}</span>
          {badge != null && badge > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>
          )}
        </span>
        {subtitle && <span className="block text-xs text-foreground-secondary">{subtitle}</span>}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-foreground-secondary" />
    </Link>
  );
}

export function MemberCenterClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProfile({
        full_name: "示範會員",
        email: "demo@example.com",
        phone: "0912345678",
        member_number: "CM000001",
      });
      setSummary({ awaitingPayment: 0, readyForPickup: 0, completed: 0, total: 0, unreadNotifications: 0, hasCarrier: false });
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/member/summary").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([authData, summaryData]) => {
        if (authData.profile) {
          setProfile({
            ...authData.profile,
            email: authData.user?.email ?? authData.profile.email,
            member_number: summaryData?.memberNumber ?? authData.profile.member_number,
          });
        }
        setEmailVerified(Boolean(authData.email_verified));
        if (summaryData?.summary) setSummary(summaryData.summary);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    if (isSupabaseConfigured()) await fetch("/api/auth/logout", { method: "POST" });
    router.push(APP_ROUTES.login);
  };

  const handleResendVerification = async () => {
    const email = profile?.email?.trim();
    if (!email) return;
    setResending(true);
    try {
      const result = await requestVerificationEmail(email);
      if (!result.ok) throw new Error(result.error ?? "寄送失敗");
      setResendMessage(result.message ?? "驗證信已寄出");
    } catch (err) {
      alert(getAuthErrorMessage(err, "resend"));
    } finally {
      setResending(false);
    }
  };

  if (!loading && !profile && isSupabaseConfigured()) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-foreground-secondary">請先登入以使用會員中心</p>
        <Link href={`${APP_ROUTES.login}?next=${encodeURIComponent(APP_ROUTES.member)}`}>
          <Button className="min-h-11 bg-primary">登入</Button>
        </Link>
      </div>
    );
  }

  const memberNo = profile?.member_number ?? profile?.member_code ?? "—";

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-xl font-bold text-caramel">會員中心</h1>

      {/* A. 會員摘要卡 */}
      <div className="rounded-[20px] bg-surface p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
            {profile?.full_name?.[0] ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-foreground">{profile?.full_name ?? "會員"}</p>
            <p className="text-sm text-foreground-secondary">{maskPhone(profile?.phone)}</p>
            <p className="truncate text-sm text-foreground-secondary">{profile?.email}</p>
            <p className="text-sm font-medium text-caramel">App 會員編號：{memberNo}</p>
          </div>
        </div>
        <Link href={APP_ROUTES.memberProfile} className="mt-4 block">
          <Button variant="outline" className="min-h-10 w-full">編輯個人資料</Button>
        </Link>
        {!emailVerified && (
          <div className="mt-4">
            <EmailVerificationNotice email={profile?.email} resending={resending} onResend={handleResendVerification} compact title="Email 尚未驗證" description="完成驗證後才能下單。" showProfileLink={false} />
            {resendMessage && <p className="mt-2 text-xs text-green-700">{resendMessage}</p>}
          </div>
        )}
      </div>

      {/* Quick: barcode + carrier */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          href={APP_ROUTES.memberBarcode}
          className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[16px] bg-surface p-3 text-center shadow-card"
        >
          <QrCode className="h-6 w-6 text-caramel" />
          <span className="text-sm font-medium text-foreground">會員條碼</span>
        </Link>
        <Link
          href={APP_ROUTES.memberCarrier}
          className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[16px] bg-surface p-3 text-center shadow-card"
        >
          <Barcode className="h-6 w-6 text-caramel" />
          <span className="text-sm font-medium text-foreground">發票載具</span>
        </Link>
      </section>

      {/* B. 我的 App 訂單 */}
      <section>
        <h2 className="mb-1 px-1 text-sm font-medium text-foreground-secondary">我的 App 訂單</h2>
        <p className="mb-2 px-1 text-xs text-foreground-secondary">
          僅顯示透過 CHIMEIDIY App 建立的商城與團購訂單，不包含門市現場消費紀錄。
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "全部", href: APP_ROUTES.memberOrders, count: summary?.total },
            { label: "待付款", href: `${APP_ROUTES.memberOrders}?filter=awaiting`, count: summary?.awaitingPayment },
            { label: "待取貨", href: `${APP_ROUTES.memberOrders}?filter=pickup`, count: summary?.readyForPickup },
            { label: "已完成", href: `${APP_ROUTES.memberOrders}?filter=completed`, count: summary?.completed },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="relative rounded-[16px] bg-surface py-3 text-center shadow-card">
              <span className="block text-xs text-foreground-secondary">{item.label}</span>
              {item.count != null && item.count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {item.count > 99 ? "99+" : item.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* C. 常用功能 */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-medium text-foreground-secondary">常用功能</h2>
        <div className="divide-y overflow-hidden rounded-[20px] bg-surface shadow-card">
          <MenuLink href={APP_ROUTES.memberOrders} icon={QrCode} label="我的 App 訂單" subtitle="商城與團購訂單（不含門市現場消費）" featured />
          <MenuLink href={APP_ROUTES.memberBenefits} icon={Gift} label="會員福利" subtitle="App 活動發放的福利（無點數／等級）" />
          <MenuLink href={APP_ROUTES.memberFavorites} icon={Heart} label="我的收藏" subtitle="商品、食譜與影音收藏" />
          <MenuLink href={APP_ROUTES.memberAddresses} icon={MapPin} label="地址管理" subtitle="管理宅配與聯絡地址" />
          <MenuLink href={APP_ROUTES.memberNotifications} icon={Bell} label="通知中心" subtitle="訂單與活動通知" badge={summary?.unreadNotifications} />
          <MenuLink href={APP_ROUTES.memberProfile} icon={User} label="個人資料" subtitle="姓名、聯絡方式與地址" />
          <MenuLink href={APP_ROUTES.memberSettings} icon={Settings} label="帳號設定" subtitle="隱私與通知偏好" />
        </div>
      </section>

      {/* D. 內容與服務 */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-medium text-foreground-secondary">內容與服務</h2>
        <div className="divide-y overflow-hidden rounded-[20px] bg-surface shadow-card">
          <MenuLink href={APP_ROUTES.stores} icon={Store} label="門市資訊" />
          <MenuLink href={APP_ROUTES.support} icon={Headphones} label="客服中心" />
          <MenuLink href={APP_ROUTES.faq} icon={HelpCircle} label="常見問題" />
          <MenuLink href="/live" icon={Radio} label="直播影音" />
          <MenuLink href="/videos" icon={Video} label="影音留存" />
          <MenuLink href="/articles" icon={FileText} label="烘焙文章" />
        </div>
      </section>

      {/* E. 帳號設定 */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-medium text-foreground-secondary">帳號設定</h2>
        <div className="divide-y overflow-hidden rounded-[20px] bg-surface shadow-card">
          <MenuLink href={APP_ROUTES.memberAccountSettings} icon={Shield} label="帳號與隱私" />
          <MenuLink href={APP_ROUTES.memberNotificationSettings} icon={Bell} label="通知設定" />
          <MenuLink href={APP_ROUTES.terms} icon={FileText} label="使用條款" />
          <MenuLink href={APP_ROUTES.privacy} icon={Shield} label="隱私權政策" />
        </div>
      </section>

      <Button variant="outline" className="min-h-11 w-full" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        登出
      </Button>
    </div>
  );
}
