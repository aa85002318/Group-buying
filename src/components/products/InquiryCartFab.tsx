"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import { useInquiryCart } from "@/hooks/useInquiryCart";

/**
 * 詢價單浮動入口。
 *
 * 詢價單跟購物車是兩條路，底部導覽沒有位置放，所以用一顆浮動按鈕；
 * 只有詢價單裡有東西時才出現，平常完全不佔畫面。
 */
export function InquiryCartFab() {
  const { count, ready } = useInquiryCart();
  const pathname = usePathname();

  if (!ready || count === 0) return null;
  // 已經在詢價單頁就不用再給入口。
  if (pathname === "/inquiry") return null;

  return (
    <Link
      href="/inquiry"
      className="fixed right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-[#153E73] pl-4 pr-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(21,62,115,0.3)]"
      style={{
        bottom: "calc(var(--bottom-nav-height, 5rem) + env(safe-area-inset-bottom, 0px) + 0.75rem)",
      }}
    >
      <FileText className="h-4 w-4" aria-hidden />
      詢價單
      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#FEE169] px-1.5 text-xs font-bold text-[#153E73]">
        {count}
      </span>
    </Link>
  );
}
