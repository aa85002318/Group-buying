"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmailVerificationNotice } from "@/components/auth/EmailVerificationNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { requestVerificationEmail } from "@/lib/auth/send-verification-client";
import { getAuthErrorMessage } from "@/lib/auth/error-messages";
import { APP_ROUTES } from "@/lib/site-links";
import { isValidBirthday, isValidTaiwanPhone } from "@/lib/validation/customer";

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    birthday: "",
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setEmail("demo@example.com");
      setEmailVerified(true);
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
        setEmailVerified(Boolean(data.email_verified));
        setForm({
          full_name: data.profile.full_name ?? "",
          phone: data.profile.phone ?? "",
          birthday: data.profile.birthday?.slice(0, 10) ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleResendVerification = async () => {
    if (!email.trim()) {
      alert("找不到 Email，請重新登入後再試");
      return;
    }
    setResending(true);
    setResendMessage(null);
    try {
      const result = await requestVerificationEmail(email);
      if (!result.ok) throw new Error(result.error ?? "寄送失敗");
      setResendMessage(result.message ?? `驗證信已寄至 ${email}，請查收信箱（含垃圾郵件）。`);
    } catch (err) {
      alert(getAuthErrorMessage(err, "resend"));
    } finally {
      setResending(false);
    }
  };

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

      {!emailVerified && (
        <div className="space-y-2">
          <EmailVerificationNotice
            email={email}
            resending={resending}
            onResend={handleResendVerification}
            title="Email 尚未驗證"
            description="完成驗證後才能下單。若沒收到信，可在此重新寄送驗證信。"
          />
          {resendMessage && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{resendMessage}</p>
          )}
        </div>
      )}

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
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                emailVerified ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"
              }`}
            >
              {emailVerified ? "已驗證" : "未驗證"}
            </span>
            {!emailVerified && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={resending}
                onClick={handleResendVerification}
              >
                {resending ? "寄送中…" : "重新寄送驗證信"}
              </Button>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {emailVerified
              ? "若要變更登入 Email，請聯絡客服協助。"
              : "請至信箱點擊驗證連結；沒收到可按「重新寄送驗證信」。"}
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "儲存中…" : "儲存變更"}
        </Button>
      </form>
    </div>
  );
}
