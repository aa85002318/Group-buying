"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandHeading } from "@/components/layout/BrandHeading";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      router.push("/");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, referrer_code: ref } },
    });
    if (!error && ref) {
      await fetch("/api/share/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refCode: ref, userId: data.user?.id }),
      });
    }
    setLoading(false);
    if (error) alert(error.message);
    else {
      alert("註冊成功！請查收驗證信。");
      router.push("/auth/login");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <BrandHeading priority />
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-white p-6 shadow-card">
        {ref && <p className="text-center text-xs text-primary">推薦碼：{ref}</p>}
        <form onSubmit={handleRegister} className="space-y-4">
          <Input placeholder="姓名" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input type="email" placeholder="電子郵件" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="密碼（至少6字元）" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "註冊中..." : "註冊"}</Button>
        </form>
        <p className="text-center text-sm text-coffee">
          已有帳號？<Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">登入</Link>
        </p>
      </div>
    </div>
  );
}
