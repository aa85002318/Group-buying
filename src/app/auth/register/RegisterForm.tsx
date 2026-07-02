"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/Logo";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { getSiteUrl } from "@/lib/env";

function getRegisterErrorMessage(err: unknown): string {
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

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
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
      const supabase = createClient();
      const siteUrl = typeof window !== "undefined" ? window.location.origin : getSiteUrl();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });
      if (error) throw error;

      // 需驗證 Email 才能登入；若 Supabase 自動建立 session 則先登出
      if (data.session) {
        await supabase.auth.signOut();
      }

      if (ref && data.user) {
        await fetch("/api/share/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref_code: ref, user_id: data.user.id }),
        });
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
          <Input placeholder="姓名" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input type="email" placeholder="電子郵件" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="密碼（至少 6 碼）" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
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
