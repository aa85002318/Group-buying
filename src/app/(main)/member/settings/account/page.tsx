"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { maskPhone } from "@/lib/services/profileService";
import { APP_ROUTES } from "@/lib/site-links";

export default function AccountSettingsPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setEmail(d.user?.email ?? d.profile?.email ?? "");
        setPhone(d.profile?.phone ?? "");
      });
  }, []);

  const changePassword = async () => {
    setError(null);
    setMessage(null);
    if (password.length < 8) {
      setError("新密碼至少需要 8 碼");
      return;
    }
    if (password !== confirmPassword) {
      setError("新密碼與確認密碼不一致");
      return;
    }
    if (!isSupabaseConfigured()) {
      setMessage("示範模式：密碼已更新");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error: pwError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (pwError) {
      setError("密碼更新失敗，請稍後再試");
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setMessage("密碼已成功更新");
  };

  const requestDeletion = async () => {
    setError(null);
    setMessage(null);
    if (deleteConfirm !== "刪除帳號") {
      setError("請輸入「刪除帳號」以確認");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/member/account-deletion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmText: deleteConfirm, reason }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "申請失敗");
      return;
    }
    setMessage(data.message);
    setDeleteConfirm("");
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.member}><ArrowLeft className="h-5 w-5 text-[#173F75]" /></Link>
          <h1 className="text-xl font-bold text-[#173F75]">帳號與隱私</h1>
        </div>

        <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_24px_rgba(23,63,117,0.06)] space-y-3">
          <h2 className="font-semibold text-[#173F75]">帳號資訊</h2>
          <div>
            <p className="text-xs text-[#6B7280]">登入 Email</p>
            <p className="text-[#202124]">{email || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6B7280]">手機號碼</p>
            <p className="text-[#202124]">{maskPhone(phone)}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Link href={APP_ROUTES.privacy} className="text-sm text-[#173F75] underline">隱私權政策</Link>
            <Link href={APP_ROUTES.terms} className="text-sm text-[#173F75] underline">使用條款</Link>
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_24px_rgba(23,63,117,0.06)] space-y-3">
          <h2 className="font-semibold text-[#173F75]">修改密碼</h2>
          <Input type="password" className="min-h-12" placeholder="新密碼（至少 8 碼）" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input type="password" className="min-h-12" placeholder="確認新密碼" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <Button className="min-h-11 w-full bg-[#173F75]" onClick={changePassword} disabled={saving}>更新密碼</Button>
        </div>

        <div className="rounded-[20px] border border-red-100 bg-white p-5 shadow-[0_4px_24px_rgba(23,63,117,0.06)] space-y-3">
          <h2 className="font-semibold text-[#DC2626]">刪除帳號申請</h2>
          <p className="text-sm text-[#6B7280]">提交申請後，我們將由客服人員審核處理。帳號不會立即刪除。</p>
          <Input className="min-h-12" placeholder="申請原因（選填）" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Input className="min-h-12" placeholder='請輸入「刪除帳號」以確認' value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
          <Button variant="outline" className="min-h-11 w-full border-[#DC2626] text-[#DC2626]" onClick={requestDeletion} disabled={saving}>提交刪除申請</Button>
        </div>

        {error && <p className="text-sm text-[#DC2626]">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
      </div>
    </RequireAuth>
  );
}
