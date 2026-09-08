import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function AdminDesktopLayoutIndexPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-1 py-2 md:px-0">
      <AdminPageHeader
        title="網頁版設定"
        description="Desktop ≥1024 版型設定。共用商品／食譜／會員資料，不另建資料庫。"
      />
      <div className="grid gap-3">
        <Link
          href="/admin/layout-settings/desktop/home"
          className="rounded-xl border bg-white px-5 py-4 transition hover:bg-[#FFF8F0]"
        >
          <p className="font-bold text-[#153E73]">網頁版首頁設定</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Hero、常用服務、活動、食譜、商品欄數與顯示開關
          </p>
        </Link>
        <div className="rounded-xl border border-dashed bg-[#FFFEFA] px-5 py-4 opacity-80">
          <p className="font-bold text-[#153E73]">App／手機版</p>
          <p className="mt-1 text-sm text-muted-foreground">
            維持既有首頁畫布與商城設定，本階段不修改。請至「前台內容管理 → 首頁畫布」。
          </p>
          <Link
            href="/admin/frontend-cms/home"
            className="mt-2 inline-block text-sm font-semibold text-[#B56A45] hover:underline"
          >
            開啟手機版首頁畫布
          </Link>
        </div>
      </div>
    </div>
  );
}
