"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/Logo";
import { isSupabaseConfigured } from "@/lib/config";
import { resolveSiteUrl } from "@/lib/env";
import { getAuthErrorMessage } from "@/lib/auth/error-messages";
import { isValidBirthday, isValidTaiwanPhone, normalizePhone } from "@/lib/validation/customer";

function getRegisterErrorMessage(err: unknown): string {
  return getAuthErrorMessage(err, "register");
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
  const [sendWarning, setSendWarning] = useState<string | null>(null);

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
      const siteUrl = resolveSiteUrl();

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          full_name: fullName.trim(),
          phone: normalizedPhone,
          birthday,
          origin: typeof window !== "undefined" ? window.location.origin : siteUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "註冊失敗");
      }

      if (ref && data.user_id) {
        await fetch("/api/share/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref_code: ref, user_id: data.user_id }),
        });
      }

      if (data.warning) {
        console.warn("Register warning:", data.warning);
        setSendWarning(String(data.warning));
      } else {
        setSendWarning(null);
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
          <h1 className="text-lg font-bold text-coffee">
            {sendWarning ? "帳號已建立" : "請查收驗證信"}
          </h1>
          {sendWarning ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {sendWarning}
              <br />
              請至登入頁按「重新寄送驗證信」。
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              我們已寄送驗證信至 <strong>{email}</strong>。請點擊信中連結完成驗證後才能登入與下單。
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            沒收到信？請檢查垃圾郵件，或至登入頁重新寄送驗證信。
          </p>
          <Link href={`/auth/login?email=${encodeURIComponent(email.trim().toLowerCase())}`}>
            <Button className="w-full">前往登入／重寄驗證信</Button>
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
