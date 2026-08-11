"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandHeading } from "@/components/layout/BrandHeading";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { APP_ROUTES } from "@/lib/site-links";
import { getAuthErrorMessage } from "@/lib/auth/error-messages";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!isSupabaseConfigured()) {
      setMessage("示範模式：已寄出重設密碼信（模擬）");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(APP_ROUTES.resetPassword)}`,
        }
      );
      if (resetError) throw resetError;
      setMessage("若此 Email 已註冊，您將收到重設密碼信件。請查收信箱（含垃圾郵件）。");
    } catch (err) {
      setError(getAuthErrorMessage(err, "login"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col items-center justify-center gap-6 p-4">
      <BrandHeading priority />
      <div className="w-full max-w-sm space-y-5 rounded-xl bg-white p-6 shadow-card">
        <div>
          <h1 className="text-lg font-bold text-[#153E73]">忘記密碼</h1>
          <p className="mt-1 text-sm text-[#687386]">
            輸入註冊 Email，我們將寄送重設密碼連結。
          </p>
        </div>
        {error ? (
          <p className="rounded-lg bg-error-soft px-3 py-2 text-sm text-error">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>
        ) : null}
        <form onSubmit={submit} className="space-y-4">
          <Input
            type="email"
            required
            placeholder="電子郵件"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "寄送中…" : "寄送重設連結"}
          </Button>
        </form>
        <p className="text-center text-sm text-coffee">
          <Link href={APP_ROUTES.login} className="font-medium text-primary">
            返回登入
          </Link>
        </p>
      </div>
    </div>
  );
}
