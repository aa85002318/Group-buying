"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmailVerificationNotice } from "@/components/auth/EmailVerificationNotice";
import { ROLE_LABELS } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/config";
import { getAuthErrorMessage } from "@/lib/auth/error-messages";
import { requestVerificationEmail } from "@/lib/auth/send-verification-client";
import { PROFILE_MENU_GROUPS, STAFF_NAV_LINKS } from "@/lib/navigation";
import { formatBirthdayDisplay } from "@/lib/validation/customer";
import { APP_ROUTES } from "@/lib/site-links";
import { MemberBarcode } from "@/components/profile/MemberBarcode";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{
    full_name?: string;
    email?: string;
    phone?: string;
    birthday?: string | null;
    member_code?: string;
    role?: string;
  } | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProfile({
        full_name: "示範會員",
        email: "demo@example.com",
        phone: "0912345678",
        birthday: "1990-05-15",
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

  const isStaffOrAdmin = profile?.role === "admin" || profile?.role === "store_staff";
  const barcodeValue = profile?.member_code || profile?.phone || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-coffee">會員中心</h1>
        <Link href={APP_ROUTES.profileEdit}>
          <Button variant="outline" size="sm">
            編輯資料
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex items-center gap-4 sm:flex-1">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
                {profile?.full_name?.[0] ?? "?"}
              </div>
              <div>
                <p className="text-lg font-bold">{profile?.full_name ?? "會員"}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="text-sm text-muted-foreground">手機：{profile?.phone ?? "—"}</p>
                <p className="text-sm text-muted-foreground">生日：{formatBirthdayDisplay(profile?.birthday)}</p>
                {profile?.role && (
                  <p className="text-xs">{ROLE_LABELS[profile.role] ?? profile.role}</p>
                )}
              </div>
            </div>
            {barcodeValue ? <MemberBarcode value={barcodeValue} className="sm:shrink-0" /> : null}
          </div>
          {!emailVerified && (
            <div className="mt-3 space-y-2">
              <EmailVerificationNotice
                email={profile?.email}
                resending={resending}
                onResend={handleResendVerification}
                compact
                title="Email 尚未驗證"
                description="完成驗證後才能下單。沒收到信可重新寄送，或至「編輯資料」處理。"
                showProfileLink={false}
              />
              {resendMessage && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">{resendMessage}</p>
              )}
              <Link href={APP_ROUTES.profileEdit} className="block text-xs text-primary hover:underline">
                前往編輯資料重新驗證 →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {PROFILE_MENU_GROUPS.map((group) => (
        <section key={group.title} className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-muted-foreground">{group.title}</h2>
          <div className="divide-y rounded-xl bg-white shadow-card">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-3 text-sm hover:bg-muted"
              >
                {item.label} →
              </Link>
            ))}
          </div>
        </section>
      ))}

      {isStaffOrAdmin && (
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-muted-foreground">門市與後台</h2>
          <div className="divide-y rounded-xl bg-white shadow-card">
            {STAFF_NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-3 text-sm hover:bg-muted"
              >
                {item.label} →
              </Link>
            ))}
            <Link href={APP_ROUTES.admin} className="block px-4 py-3 text-sm hover:bg-muted">
              管理後台 →
            </Link>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-medium text-muted-foreground">LINE 私域社群</h2>
        <div className="divide-y rounded-xl bg-white shadow-card">
          <div className="px-4 py-3 text-sm">
            您已被邀請加入「CHIMEIDIY 大安分店 團購群組」！請點選以下連結加入社群！
          </div>
          <a
            href="https://line.me/ti/g2/_r8v5uBC3xDAm5cW5s1DejMj3wJjYTAZ90rKHQ?utm_source=invitation&utm_medium=link_copy&utm_campaign=default"
            target="_blank"
            rel="noreferrer"
            className="block px-4 py-3 text-sm font-medium text-primary hover:bg-muted"
          >
            加入社群 →
          </a>
        </div>
      </section>

      <Button variant="outline" className="w-full" onClick={handleLogout}>
        登出
      </Button>
    </div>
  );
}
