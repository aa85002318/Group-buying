import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/env";

const REASON_COPY: Record<string, string> = {
  expired: "驗證連結已過期或已使用過，請至登入頁重新寄送驗證信。",
  otp: "驗證連結無效，請至登入頁重新寄送驗證信。",
  code: "登入驗證碼交換失敗，請重新點擊信中連結，或重新寄送驗證信。",
  missing: "驗證參數不完整。請使用信中的按鈕／連結，不要手動修改網址。",
};

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const reason = searchParams.reason;
  const message =
    (reason && REASON_COPY[reason]) ||
    "電子郵件驗證未完成，請確認連結是否正確，或至登入頁重新寄送驗證信。";

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col items-center justify-center gap-6 p-4">
      <Logo size="auth" priority />
      <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 text-center shadow-card">
        <h1 className="text-lg font-bold text-coffee">驗證失敗</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">如需協助，請聯絡 {BRAND_NAME} 客服。</p>
        <div className="flex flex-col gap-2 pt-2">
          <Link href="/auth/login">
            <Button className="w-full">登入／重新寄送驗證信</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline" className="w-full">
              重新註冊
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
