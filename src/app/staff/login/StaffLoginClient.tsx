"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/Logo";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { APP_ROUTES } from "@/lib/site-links";

const STAFF_ROLES = new Set(["admin", "store_staff"]);

export default function StaffLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? APP_ROUTES.staffPickupScan;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      router.push(next);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError("登入失敗");
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (!profile?.role || !STAFF_ROLES.has(profile.role)) {
      await supabase.auth.signOut();
      setError("此帳號無門市人員權限，請聯絡管理員");
      return;
    }

    router.push(next.startsWith("/") ? next : APP_ROUTES.staffPickupScan);
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo size="header" />
        <h1 className="text-xl font-bold text-coffee">門市人員登入</h1>
        <p className="text-sm text-muted-foreground">登入後可掃碼查單、確認收款與取貨</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 rounded-xl bg-card p-6 shadow-card">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">密碼</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" variant="promo" disabled={loading}>
          {loading ? "登入中…" : "門市登入"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        <Link href={APP_ROUTES.login} className="text-primary hover:underline">
          一般會員登入
        </Link>
        {" · "}
        <Link href={APP_ROUTES.home} className="text-primary hover:underline">
          返回首頁
        </Link>
      </p>
    </div>
  );
}
