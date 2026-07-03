"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/Logo";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { resolveSiteUrl } from "@/lib/env";
import { requestVerificationEmail } from "@/lib/auth/send-verification-client";
import { isValidBirthday, isValidTaiwanPhone, normalizePhone } from "@/lib/validation/customer";

function getRegisterErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const maybe = err as Record<string, unknown>;
    const name = typeof maybe.name === "string" ? maybe.name : "";
    const status = typeof maybe.status === "number" ? maybe.status : 0;
    if (name === "AuthRetryableFetchError" || status >= 500) {
      return "註冊失敗：Supabase Auth 服務暫時錯誤（500）。請檢查 Supabase Email 設定（特別是自訂 SMTP）或稍後再試。";
    }
  }

  if (err instanceof Error && err.message && err.message !== "{}") {
    return err.message;
  }

  if (err && typeof err === "object") {
    const maybe = err as Record<string, unknown>;
    const candidates = [
      maybe.message,
      maybe.error_description,
      maybe.error,
      maybe.msg,
    ];

    for (const value of candidates) {
      if (typeof value === "string" && value.trim() && value.trim() !== "{}") {
        const normalized = value.trim().toLowerCase();
        if (
          normalized.includes("trycloudflare.com") ||
          normalized.includes("redirect_to") ||
          normalized.includes("not allowed")
        ) {
          return "註冊失敗：Supabase 尚未允許目前網址。請到 Supabase Authentication > URL Configuration，將目前網域加入 Site URL 與 Redirect URLs（/auth/callback）。";
        }
        return value;
      }
    }

    try {
      const raw = JSON.stringify(err);
      if (raw && raw !== "{}") return raw;
    } catch {
      // noop
    }
  }

  return "註冊失敗，請稍後再試。若使用手機測試，請確認 Supabase Redirect URL 已加入目前網址。";
}

function isRedirectBlockedError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const maybe = err as Record<string, unknown>;
  const text = [
    maybe.message,
    maybe.error_description,
    maybe.error,
  ]
    .filter((v): v is string => typeof v === "string")
    .join(" ")
    .toLowerCase();

  return (
    text.includes("redirect") ||
    text.includes("redirect_to") ||
    text.includes("not allowed") ||
    text.includes("url not allowed")
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidTaiwanPhone(phone)) {
      alert("請輸入有效的手機號碼（09 開頭，共 10 碼）");
      return;
    }
    if (!isValidBirthday(birthday)) {
      alert("請輸入有效的生日");
      return;
    }

    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        if (ref) {
          await fetch("/api/share/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ref_code: ref }),
          });
        }
        router.push("/");
        return;
      }

      const normalizedPhone = normalizePhone(phone);
      const supabase = createClient();
      const siteUrl = resolveSiteUrl();
      const userMeta = {
        full_name: fullName.trim(),
        phone: normalizedPhone,
        birthday,
      };

      let { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMeta,
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error && isRedirectBlockedError(error)) {
        const retry = await supabase.auth.signUp({
          email,
          password,
          options: { data: userMeta },
        });
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      if (data.session) {
        await supabase.auth.signOut();
      }

      if (data.user) {
        const profileRes = await fetch("/api/auth/complete-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: data.user.id,
            full_name: fullName.trim(),
            phone: normalizedPhone,
            birthday,
            email,
          }),
        });
        if (!profileRes.ok) {
          const profileErr = await profileRes.json().catch(() => ({}));
          throw new Error(profileErr.error ?? "客戶資料儲存失敗");
        }
      }

      if (ref && data.user) {
        await fetch("/api/share/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref_code: ref, user_id: data.user.id }),
        });
      }

      const verifyResult = await requestVerificationEmail(email);
      if (!verifyResult.ok && !verifyResult.skipped) {
        console.warn("Verification email via Resend failed:", verifyResult.error);
      }

      setSent(true);
    } catch (err) {
      console.error("Register failed:", err);
      alert(getRegisterErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col items-center justify-center gap-6 p-4">
        <Logo size="auth" priority />
        <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 text-center shadow-card">
          <h1 className="text-lg font-bold text-coffee">請查收驗證信</h1>
          <p className="text-sm text-muted-foreground">
            我們已寄送驗證信至 <strong>{email}</strong>。請點擊信中連結完成驗證後才能登入與下單。
          </p>
          <p className="text-xs text-muted-foreground">
            沒收到信？請檢查垃圾郵件，或至登入頁重新寄送驗證信。
          </p>
          <Link href="/auth/login">
            <Button className="w-full">前往登入</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col items-center justify-center gap-6 p-4">
      <Logo size="auth" priority />
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-white p-6 shadow-card">
        <p className="text-center text-sm text-coffee/70">加入會員，開始團購</p>
        {ref && <p className="text-center text-xs text-primary">推薦碼：{ref}</p>}
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            placeholder="姓名"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />
          <Input
            type="tel"
            placeholder="手機號碼（09xxxxxxxx）"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            required
          />
          <div>
            <label htmlFor="birthday" className="mb-1 block text-xs text-muted-foreground">
              生日
            </label>
            <Input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              required
            />
          </div>
          <Input
            type="email"
            placeholder="電子郵件"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            type="password"
            placeholder="密碼（至少 6 碼）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-muted-foreground">註冊後會員條碼將為您的手機號碼。</p>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "註冊中..." : "註冊"}
          </Button>
        </form>
        <p className="text-center text-sm text-coffee">
          已有帳號？<Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">立即登入</Link>
        </p>
      </div>
    </div>
  );
}
