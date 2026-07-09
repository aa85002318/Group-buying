"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmailVerificationNoticeProps {
  email?: string;
  resending?: boolean;
  onResend?: () => void | Promise<void>;
  compact?: boolean;
}

/** Shown when a logged-in member must verify email before purchasing. */
export function EmailVerificationNotice({
  email,
  resending = false,
  onResend,
  compact = false,
}: EmailVerificationNoticeProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <p className={compact ? "text-sm font-medium" : "font-medium"}>
        請先完成 Email 驗證才能購買商品
      </p>
      <p className="mt-1 text-sm text-amber-900/90">
        {email
          ? `驗證信會寄至 ${email}，請至信箱（含垃圾郵件）點擊連結。`
          : "請至信箱點擊驗證連結後再結帳。"}
      </p>
      <div className={`flex flex-wrap gap-2 ${compact ? "mt-3" : "mt-4"}`}>
        {onResend && (
          <Button type="button" size="sm" variant="outline" disabled={resending} onClick={() => void onResend()}>
            {resending ? "寄送中..." : "重新寄送驗證信"}
          </Button>
        )}
        <Link href="/profile">
          <Button type="button" size="sm" variant="ghost">
            會員中心
          </Button>
        </Link>
      </div>
    </div>
  );
}
