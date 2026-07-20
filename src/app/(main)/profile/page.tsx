"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Barcode,
  Bell,
  ChevronRight,
  Headphones,
  Heart,
  LogOut,
  MapPin,
  Package,
  QrCode,
  Store,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmailVerificationNotice } from "@/components/auth/EmailVerificationNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { getAuthErrorMessage } from "@/lib/auth/error-messages";
import { requestVerificationEmail } from "@/lib/auth/send-verification-client";
import { maskPhone } from "@/lib/services/profileService";
import { APP_ROUTES } from "@/lib/site-links";

type ProfileSummary = {
  full_name?: string;
  email?: string;
  phone?: string;
  member_code?: string;
  role?: string;
};

const MENU_ITEMS = [
  { href: APP_ROUTES.orders, label: "我的訂單", icon: Package },
  { href: APP_ROUTES.orders, label: "取貨 QR Code", icon: QrCode, subtitle: "查看訂單取貨碼" },
  { href: APP_ROUTES.memberCarrier, label: "發票載具", icon: Barcode, subtitle: "結帳時快速出示手機條碼", featured: true },
  { href: APP_ROUTES.products, label: "收藏商品", icon: Heart, subtitle: "瀏覽商品" },
  { href: APP_ROUTES.memberProfile, label: "收件地址", icon: MapPin, subtitle: "於個人資料管理地址" },
  { href: APP_ROUTES.memberProfile, label: "個人資料", icon: User },
  { href: "/notifications", label: "通知設定", icon: Bell },
  { href: "/support", label: "客服中心", icon: Headphones },
  { href: APP_ROUTES.memberStores, label: "門市資訊", icon: Store },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProfile({
        full_name: "示範會員",
        email: "demo@example.com",
        phone: "0912345678",
        member_code: "0912345678",
        role: "member",
      });
      return;
    }
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile({ ...data.profile, email: data.user?.email ?? data.profile.email });
        }
        setEmailVerified(Boolean(data.email_verified));
      })
      .catch(() => {});
  }, []);

  const handleResendVerification = async () => {
    const email = profile?.email?.trim();
    if (!email) {
      alert("找不到 Email，請重新登入後再試");
      return;
    }
    setResending(true);
    setResendMessage(null);
    try {
      const result = await requestVerificationEmail(email);
      if (!result.ok) throw new Error(result.error ?? "寄送失敗");
      setResendMessage(result.message ?? `驗證信已寄至 ${email}，請查收信箱（含垃圾郵件）。`);
    } catch (err) {
      alert(getAuthErrorMessage(err, "resend"));
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await fetch("/api/auth/logout", { method: "POST" });
    }
    router.push(APP_ROUTES.login);
  };

  const isLoggedIn = Boolean(profile);

  if (!isLoggedIn && isSupabaseConfigured()) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-[#6B7280]">請先登入以使用會員中心</p>
        <Link href={`${APP_ROUTES.login}?next=${encodeURIComponent(APP_ROUTES.profile)}`}>
          <Button className="min-h-11 bg-[#E9285C] hover:bg-[#D01F50]">登入</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-xl font-bold text-[#173F75]">我的</h1>

      <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_24px_rgba(23,63,117,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E9285C] to-[#FF6A3D] text-xl font-bold text-white">
              {profile?.full_name?.[0] ?? "?"}
            </div>
            <div>
              <p className="text-lg font-bold text-[#202124]">{profile?.full_name ?? "會員"}</p>
              <p className="text-sm text-[#6B7280]">會員編號：{profile?.member_code ?? "—"}</p>
              <p className="text-sm text-[#6B7280]">{maskPhone(profile?.phone)}</p>
              <p className="text-sm text-[#6B7280]">{profile?.email ?? "—"}</p>
            </div>
          </div>
        </div>
        <Link href={APP_ROUTES.memberProfile} className="mt-4 block">
          <Button variant="outline" size="sm" className="min-h-10 w-full">
            編輯個人資料
          </Button>
        </Link>

        {!emailVerified && (
          <div className="mt-4 space-y-2">
            <EmailVerificationNotice
              email={profile?.email}
              resending={resending}
              onResend={handleResendVerification}
              compact
              title="Email 尚未驗證"
              description="完成驗證後才能下單。"
              showProfileLink={false}
            />
            {resendMessage && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">{resendMessage}</p>
            )}
          </div>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-medium text-[#6B7280]">常用功能</h2>
        <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_4px_24px_rgba(23,63,117,0.06)]">
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isFeatured = "featured" in item && item.featured;
            return (
              <Link
                key={`${item.label}-${index}`}
                href={item.href}
                className={`flex min-h-[56px] items-center gap-3 px-4 py-3 transition hover:bg-[#F7F8FC] ${
                  index > 0 ? "border-t border-[#E8EBF4]" : ""
                } ${isFeatured ? "bg-gradient-to-r from-[#FFF5F7] to-white" : ""}`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isFeatured ? "bg-[#E9285C]/10 text-[#E9285C]" : "bg-[#F7F8FC] text-[#173F75]"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-[#202124]">{item.label}</span>
                  {"subtitle" in item && item.subtitle && (
                    <span className="block text-xs text-[#6B7280]">{item.subtitle}</span>
                  )}
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#6B7280]" />
              </Link>
            );
          })}
        </div>
      </section>

      <Button variant="outline" className="min-h-11 w-full" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        登出
      </Button>
    </div>
  );
}
