"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmailVerificationNotice } from "@/components/auth/EmailVerificationNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { requestVerificationEmail } from "@/lib/auth/send-verification-client";
import { getAuthErrorMessage } from "@/lib/auth/error-messages";
import { GENDER_LABELS, type ProfileGender } from "@/lib/services/profileService";
import { isValidBirthday, isValidTaiwanPhone } from "@/lib/validation/customer";
import { CITY_NAMES, TAIWAN_CITIES } from "@/lib/taiwan-regions";
import { APP_ROUTES } from "@/lib/site-links";

export default function MemberProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(true);
  const [resending, setResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    birthday: "",
    gender: "" as ProfileGender | "",
    city: "",
    district: "",
    contact_address: "",
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setEmail("demo@example.com");
      setForm({
        full_name: "示範會員",
        phone: "0912345678",
        birthday: "1990-05-15",
        gender: "female",
        city: "台北市",
        district: "信義區",
        contact_address: "",
      });
      setLoading(false);
      return;
    }

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.profile) return;
        setEmail(data.user?.email ?? data.profile.email ?? "");
        setEmailVerified(Boolean(data.email_verified));
        setForm({
          full_name: data.profile.full_name ?? "",
          phone: data.profile.phone ?? "",
          birthday: data.profile.birthday?.slice(0, 10) ?? "",
          gender: (data.profile.gender as ProfileGender) ?? "",
          city: data.profile.city ?? "",
          district: data.profile.district ?? "",
          contact_address: data.profile.contact_address ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const districts = form.city ? TAIWAN_CITIES[form.city] ?? [] : [];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!form.full_name.trim()) {
      setErrorMessage("請填寫姓名");
      return;
    }
    if (!isValidTaiwanPhone(form.phone)) {
      setErrorMessage("請輸入有效的手機號碼（09 開頭，共 10 碼）");
      return;
    }
    if (form.birthday && !isValidBirthday(form.birthday)) {
      setErrorMessage("請輸入有效的生日");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
          birthday: form.birthday || null,
          gender: form.gender || null,
          city: form.city || null,
          district: form.district || null,
          contact_address: form.contact_address || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新失敗");
      setSuccessMessage("個人資料已儲存");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    setResending(true);
    try {
      const result = await requestVerificationEmail(email);
      if (!result.ok) throw new Error(result.error ?? "寄送失敗");
      setSuccessMessage(result.message ?? "驗證信已寄出");
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err, "resend"));
    } finally {
      setResending(false);
    }
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.profile} className="text-[#173F75]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-[#173F75]">會員資料</h1>
        </div>

        {loading ? (
          <p className="py-12 text-center text-foreground-secondary">載入中…</p>
        ) : (
          <>
            {!emailVerified && (
              <EmailVerificationNotice
                email={email}
                resending={resending}
                onResend={handleResendVerification}
                title="Email 尚未驗證"
                description="完成驗證後才能下單。"
              />
            )}

            <form onSubmit={save} className="space-y-4 rounded-[20px] bg-surface p-5 shadow-[0_4px_24px_rgba(23,63,117,0.06)]">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">姓名 *</label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="min-h-12" required />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">手機 *</label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="min-h-12"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <Input type="email" value={email} disabled className="min-h-12 bg-[#F7F8FC]" />
                <p className="mt-1 text-xs text-foreground-secondary">Email 為登入帳號，如需變更請聯絡客服</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  生日 <span className="text-foreground-secondary">（選填）</span>
                </label>
                <Input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className="min-h-12" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  性別 <span className="text-foreground-secondary">（選填）</span>
                </label>
                <select
                  className="input-field min-h-12 w-full"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as ProfileGender | "" })}
                >
                  <option value="">請選擇</option>
                  {(Object.entries(GENDER_LABELS) as [ProfileGender, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    縣市 <span className="text-foreground-secondary">（選填）</span>
                  </label>
                  <select
                    className="input-field min-h-12 w-full"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value, district: "" })}
                  >
                    <option value="">請選擇</option>
                    {CITY_NAMES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    行政區 <span className="text-foreground-secondary">（選填）</span>
                  </label>
                  <select
                    className="input-field min-h-12 w-full"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    disabled={!form.city}
                  >
                    <option value="">請選擇</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  聯絡地址 <span className="text-foreground-secondary">（選填）</span>
                </label>
                <Input
                  value={form.contact_address}
                  onChange={(e) => setForm({ ...form, contact_address: e.target.value })}
                  className="min-h-12"
                  placeholder="街道、門牌等"
                />
              </div>

              {errorMessage && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[#DC2626]">{errorMessage}</p>}
              {successMessage && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{successMessage}</p>}

              <Button type="submit" disabled={saving} className="min-h-11 w-full bg-primary hover:bg-[#D01F50]">
                {saving ? "儲存中…" : "儲存"}
              </Button>
            </form>
          </>
        )}
      </div>
    </RequireAuth>
  );
}
