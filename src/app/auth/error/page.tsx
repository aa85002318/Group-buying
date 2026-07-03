import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/env";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const reason = searchParams.reason;

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col items-center justify-center gap-6 p-4">
      <Logo size="auth" priority />
      <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 text-center shadow-card">
        <h1 className="text-lg font-bold text-coffee">驗證失敗</h1>
        <p className="text-sm text-muted-foreground">
          {reason === "expired"
            ? "驗證連結已過期，請重新註冊或申請寄送驗證信。"
            : "電子郵件驗證未完成，請確認連結是否正確或稍後再試。"}
        </p>
        <p className="text-xs text-muted-foreground">
          如需協助，請聯絡 {BRAND_NAME} 客服。
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link href="/auth/register">
            <Button className="w-full">重新註冊</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              返回登入
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
