"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { EmailVerificationNotice } from "@/components/auth/EmailVerificationNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { maskPhone } from "@/lib/services/profileService";
import { requestVerificationEmail } from "@/lib/auth/send-verification-client";
import { getAuthErrorMessage } from "@/lib/auth/error-messages";
import { APP_ROUTES } from "@/lib/site-links";

const QUICK_LINKS = [
  { href: APP_ROUTES.memberPhoneChange, label: "變更手機號碼" },
  { href: APP_ROUTES.memberLineSettings, label: "LINE 綁定／解除" },
  { href: APP_ROUTES.memberLoginDevices, label: "登入裝置管理" },
  { href: APP_ROUTES.memberDataExport, label: "個資下載" },
  { href: APP_ROUTES.memberPrivacyConsents, label: "同意紀錄" },
  { href: APP_ROUTES.forgotPassword, label: "忘記密碼（寄送重設信）" },
] as const;

export default function AccountSettingsPage() {
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setEmail(d.user?.email ?? d.profile?.email ?? "");
        setEmailVerified(Boolean(d.email_verified));
        setPhone(d.profile?.phone ?? "");
      });
  }, []);

  const changePassword = async () => {
    setError(null);
    setMessage(null);
    if (password.length < 8) {
      setError("新密碼至少需要 8 碼");
      return;
    }
    if (password !== confirmPassword) {
      setError("新密碼與確認密碼不一致");
      return;
    }
    if (!isSupabaseConfigured()) {
      setMessage("示範模式：密碼已更新");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error: pwError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (pwError) {
      setError("密碼更新失敗，請稍後再試");
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setMessage("密碼已成功更新");
  };

  const requestDeletion = async () => {
    setError(null);
    setMessage(null);
    if (deleteConfirm !== "刪除帳號") {
      setError("請輸入「刪除帳號」以確認");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/member/account-deletion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmText: deleteConfirm, reason }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "申請失敗");
      return;
    }
    setMessage(data.message);
    setDeleteConfirm("");
  };

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    setResending(true);
    setError(null);
    try {
      const result = await requestVerificationEmail(email);
      if (!result.ok) throw new Error(result.error ?? "寄送失敗");
      setMessage(result.message ?? "驗證信已寄出");
    } catch (err) {
      setError(getAuthErrorMessage(err, "resend"));
    } finally {
      setResending(false);
    }
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.memberSettings}>
            <ArrowLeft className="h-5 w-5 text-caramel" />
          </Link>
          <h1 className="text-xl font-bold text-caramel">帳號與安全</h1>
        </div>

        {!emailVerified && (
          <EmailVerificationNotice
            email={email}
            resending={resending}
            onResend={handleResendVerification}
            title="Email 尚未驗證"
            description="完成驗證後才能下單與使用完整會員功能。"
          />
        )}

        <div className="space-y-3 rounded-[20px] bg-surface p-5 shadow-card">
          <h2 className="font-semibold text-caramel">帳號資訊</h2>
          <div>
            <p className="text-xs text-foreground-secondary">登入 Email</p>
            <p className="text-foreground">{email || "—"}</p>
            <p className="mt-1 text-xs text-foreground-secondary">
              驗證狀態：{emailVerified ? "已驗證" : "未驗證"}
            </p>
          </div>
          <div>
            <p className="text-xs text-foreground-secondary">手機號碼</p>
            <p className="text-foreground">{maskPhone(phone)}</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href={APP_ROUTES.privacy} className="text-sm text-caramel underline">
              隱私權政策
            </Link>
            <Link href={APP_ROUTES.terms} className="text-sm text-caramel underline">
              會員條款
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[20px] bg-surface shadow-card">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-12 items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-surface-soft"
            >
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-foreground-secondary" />
            </Link>
          ))}
        </div>

        <div className="space-y-3 rounded-[20px] bg-surface p-5 shadow-card">
          <h2 className="font-semibold text-caramel">修改密碼</h2>
          <Input
            type="password"
            className="min-h-12"
            placeholder="新密碼（至少 8 碼）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            className="min-h-12"
            placeholder="確認新密碼"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button className="min-h-11 w-full bg-caramel" onClick={changePassword} disabled={saving}>
            更新密碼
          </Button>
        </div>

        <div className="space-y-3 rounded-[20px] border border-red-100 bg-surface p-5 shadow-card">
          <h2 className="font-semibold text-error">帳號刪除申請</h2>
          <p className="text-sm text-foreground-secondary">
            提交申請後，客服將審核處理。帳號不會立即刪除。
          </p>
          <Input
            className="min-h-12"
            placeholder="申請原因（選填）"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Input
            className="min-h-12"
            placeholder='請輸入「刪除帳號」以確認'
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <Button
            variant="outline"
            className="min-h-11 w-full border-error text-error"
            onClick={requestDeletion}
            disabled={saving}
          >
            提交刪除申請
          </Button>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
      </div>
    </RequireAuth>
  );
}
