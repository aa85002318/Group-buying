"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { maskPhone } from "@/lib/services/profileService";
import { APP_ROUTES } from "@/lib/site-links";

export default function PhoneChangePage() {
  const [currentPhone, setCurrentPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCurrentPhone(d.profile?.phone ?? ""));
  }, []);

  const requestCode = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/member/phone-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "申請失敗");
      setMessage(data.message ?? "驗證碼已寄出");
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "申請失敗");
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/member/phone-change", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "驗證失敗");
      setCurrentPhone(data.phone ?? phone);
      setPhone("");
      setCode("");
      setStep("request");
      setMessage("手機號碼已更新並完成驗證");
    } catch (err) {
      setError(err instanceof Error ? err.message : "驗證失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.memberSettings}>
            <ArrowLeft className="h-5 w-5 text-caramel" />
          </Link>
          <h1 className="text-xl font-bold text-caramel">變更手機</h1>
        </div>

        <div className="space-y-3 rounded-[20px] bg-surface p-5 shadow-card">
          <p className="text-sm text-foreground-secondary">
            目前手機：{maskPhone(currentPhone)}
          </p>
          <p className="text-sm text-foreground-secondary">
            變更時會檢查是否已被其他會員使用，並寄送驗證碼至您的登入 Email。
          </p>

          {step === "request" ? (
            <>
              <Input
                type="tel"
                className="min-h-12"
                placeholder="新手機號碼（09 開頭）"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button className="min-h-11 w-full" disabled={loading} onClick={requestCode}>
                {loading ? "處理中…" : "檢查並寄送驗證碼"}
              </Button>
            </>
          ) : (
            <>
              <Input
                className="min-h-12"
                placeholder="6 碼驗證碼"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
              />
              <Button className="min-h-11 w-full" disabled={loading} onClick={confirmCode}>
                {loading ? "驗證中…" : "確認變更"}
              </Button>
              <Button
                variant="outline"
                className="min-h-11 w-full"
                disabled={loading}
                onClick={() => {
                  setStep("request");
                  setCode("");
                }}
              >
                重新輸入手機
              </Button>
            </>
          )}

          {error && <p className="text-sm text-error">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
        </div>
      </div>
    </RequireAuth>
  );
}
