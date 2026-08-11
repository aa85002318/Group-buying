"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandHeading } from "@/components/layout/BrandHeading";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { APP_ROUTES } from "@/lib/site-links";
import { getAuthErrorMessage } from "@/lib/auth/error-messages";

export default function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setReady(true);
        setError(null);
      }
    });

    // Give hash/callback a moment; if still no session, show error
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!cancelled && !data.session) {
          setError("重設連結無效或已過期，請重新申請忘記密碼。");
        }
      });
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password.length < 8) {
      setError("新密碼至少需要 8 碼");
      return;
    }
    if (password !== confirm) {
      setError("新密碼與確認密碼不一致");
      return;
    }
    if (!isSupabaseConfigured()) {
      setMessage("示範模式：密碼已更新");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updError } = await supabase.auth.updateUser({ password });
      if (updError) throw updError;
      setMessage("密碼已更新，請使用新密碼登入。");
      setTimeout(() => router.push(APP_ROUTES.login), 1500);
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
          <h1 className="text-lg font-bold text-[#153E73]">重設密碼</h1>
          <p className="mt-1 text-sm text-[#687386]">請設定新的登入密碼。</p>
        </div>
        {error ? (
          <p className="rounded-lg bg-error-soft px-3 py-2 text-sm text-error">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>
        ) : null}
        <form onSubmit={submit} className="space-y-4">
          <Input
            type="password"
            required
            placeholder="新密碼（至少 8 碼）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!ready && isSupabaseConfigured()}
          />
          <Input
            type="password"
            required
            placeholder="確認新密碼"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={!ready && isSupabaseConfigured()}
          />
          <Button type="submit" className="w-full" disabled={loading || (!ready && isSupabaseConfigured())}>
            {loading ? "更新中…" : "更新密碼"}
          </Button>
        </form>
        <p className="text-center text-sm text-coffee">
          <Link href={APP_ROUTES.forgotPassword} className="font-medium text-primary">
            重新申請重設連結
          </Link>
        </p>
      </div>
    </div>
  );
}
