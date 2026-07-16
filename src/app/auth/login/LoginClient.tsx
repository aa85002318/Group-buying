"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandHeading } from "@/components/layout/BrandHeading";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { ROLE_LABELS } from "@/lib/utils";
import { getAuthErrorMessage } from "@/lib/auth/error-messages";
import { requestVerificationEmail } from "@/lib/auth/send-verification-client";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const lineUserId = searchParams.get("line_user_id");
  const errorCode = searchParams.get("error");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionRole, setSessionRole] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setSessionEmail(user.email ?? null);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setSessionRole(profile?.role ?? null);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSessionEmail(null);
    setSessionRole(null);
    router.refresh();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      router.push("/");
      return;
    }
    setLoading(true);
    setLoginError(null);
    setResendMessage(null);
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        setLoginError("email_not_confirmed");
        return;
      }
      setLoginError(getAuthErrorMessage(error, "login"));
      return;
    }

    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      setLoginError("email_not_confirmed");
      return;
    }

    // If LINE login happened first, callback redirected here with line_user_id.
    // After email/password login succeeds, bind LINE user id to this account.
    if (lineUserId && data?.user?.id) {
      try {
        const bindRes = await fetch("/api/line/bind", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineUserId }),
        });
        if (!bindRes.ok) {
          console.warn("[line] bind failed:", await bindRes.json().catch(() => ({})));
        }
      } catch (err) {
        console.warn("[line] bind error:", err);
      }
    }

    router.push(next.startsWith("/") ? next : "/");
    router.refresh();
  };

  const handleResendVerification = async () => {
    if (!email) {
      alert("請先輸入註冊時使用的 Email");
      return;
    }
    setResendLoading(true);
    setResendMessage(null);
    try {
      const viaResend = await requestVerificationEmail(email);
      if (viaResend.ok) {
        setResendMessage(`驗證信已寄至 ${email.trim()}，請查收信箱（含垃圾郵件匣）。`);
        return;
      }

      if (!viaResend.skipped) {
        throw new Error(viaResend.error ?? "寄送失敗");
      }

      // Resend 未設定時，改由瀏覽器直接呼叫 Supabase
      if (!isSupabaseConfigured()) {
        alert("尚未設定 Resend 或 Supabase，無法寄送驗證信");
        return;
      }

      const supabase = createClient();
      const siteUrl = window.location.origin;
      let { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("redirect") ||
          msg.includes("redirect_to") ||
          msg.includes("not allowed") ||
          msg.includes("url not allowed")
        ) {
          const retry = await supabase.auth.resend({
            type: "signup",
            email: email.trim(),
          });
          error = retry.error;
        }
      }

      if (error) throw error;
      setResendMessage("驗證信已重新寄出，請查收信箱（含垃圾郵件匣）。");
    } catch (err) {
      const message = getAuthErrorMessage(err, "resend");
      alert(message);
    } finally {
      setResendLoading(false);
    }
  };

  const errorMessage =
    errorCode === "admin_required"
      ? "此頁面需要管理員或門市人員權限。請使用具權限的帳號登入，或請管理員執行 npm run set-admin。"
      : errorCode === "staff_required"
        ? "門市掃碼需要門市人員或管理員權限。"
        : null;

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col items-center justify-center gap-6 p-4">
      <BrandHeading priority />
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-white p-6 shadow-card">
        <p className="text-center text-sm text-coffee/70">登入您的帳號</p>

        {errorMessage && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{errorMessage}</p>
        )}

        {loginError && loginError !== "email_not_confirmed" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{loginError}</p>
        )}

        {loginError === "email_not_confirmed" && (
          <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-900">
            <p>此帳號尚未完成 Email 驗證，請先至信箱點擊驗證連結後再登入。</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resendLoading}
              onClick={handleResendVerification}
            >
              {resendLoading ? "寄送中..." : "重新寄送驗證信"}
            </Button>
          </div>
        )}

        {resendMessage && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{resendMessage}</p>
        )}

        {sessionEmail && (
          <div className="rounded-lg bg-muted px-3 py-2 text-sm">
            <p>
              目前已登入：<strong>{sessionEmail}</strong>
            </p>
            {sessionRole && (
              <p className="text-muted-foreground">
                角色：{ROLE_LABELS[sessionRole] ?? sessionRole}
              </p>
            )}
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleLogout}>
              登出並切換帳號
            </Button>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input type="email" placeholder="電子郵件" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="密碼" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登入中..." : "登入"}
          </Button>
        </form>
        <p className="text-center text-sm text-coffee">
          還沒有帳號？<Link href="/auth/register" className="font-medium text-primary hover:text-primary/80">立即註冊</Link>
        </p>

        <div className="space-y-2 pt-2">
          <a
            href={`/api/line/oauth/start?next=${encodeURIComponent(next)}`}
            className="block w-full rounded-md border border-border bg-white px-4 py-2 text-center text-sm font-medium text-coffee hover:bg-muted"
          >
            使用 LINE 登入 / 綁定通知
          </a>
          {lineUserId ? (
            <p className="text-center text-xs text-muted-foreground">
              你已完成 LINE 授權，請登入帳號後自動完成綁定。
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
