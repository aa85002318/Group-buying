"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/config";
import { APP_ROUTES } from "@/lib/site-links";
import { isValidBirthday, isValidTaiwanPhone } from "@/lib/validation/customer";

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    birthday: "",
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setEmail("demo@example.com");
      setForm({ full_name: "示範會員", phone: "0912345678", birthday: "1990-05-15" });
      setLoading(false);
      return;
    }
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.profile) {
          router.replace(APP_ROUTES.login);
          return;
        }
        setEmail(data.user?.email ?? data.profile.email ?? "");
        setForm({
          full_name: data.profile.full_name ?? "",
          phone: data.profile.phone ?? "",
          birthday: data.profile.birthday?.slice(0, 10) ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidTaiwanPhone(form.phone)) {
      alert("請輸入有效的手機號碼（09 開頭，共 10 碼）");
      return;
    }
    if (!isValidBirthday(form.birthday)) {
      alert("請輸入有效的生日");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新失敗");
      router.push(APP_ROUTES.profile);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">載入中…</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-coffee">編輯會員資料</h1>
        <Link href={APP_ROUTES.profile} className="text-sm text-primary hover:underline">
          返回
        </Link>
      </div>

      <form onSubmit={save} className="space-y-4 rounded-xl bg-white p-4 shadow-card">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">姓名</label>
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">手機（會員條碼）</label>
          <Input
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="09xxxxxxxx"
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">變更手機後，會員條碼會同步更新為新號碼。</p>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">生日</label>
          <Input
            type="date"
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Email（登入帳號）</label>
          <Input type="email" value={email} disabled className="bg-muted" />
          <p className="mt-1 text-xs text-muted-foreground">若要變更登入 Email，請聯絡客服協助。</p>
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "儲存中…" : "儲存變更"}
        </Button>
      </form>
    </div>
  );
}
