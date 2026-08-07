import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CHECKS: Array<{ id: string; title: string; how: string }> = [
  { id: "1", title: "會員查看本月兌換項目", how: "/member/benefits 或 /member/gifts" },
  { id: "2", title: "顯示兌換數量與剩餘數量", how: "活動卡剩餘／限領資訊" },
  { id: "3", title: "顯示兌換條件", how: "terms／資格文案" },
  { id: "4", title: "顯示指定兌換門市", how: "門市名稱或全部门市" },
  { id: "5", title: "數量為 0 顯示兌換完畢", how: "灰階＋停用領取" },
  { id: "6", title: "數量為 0 不能繼續領券", how: "API exhausted" },
  { id: "7", title: "不超過個人領取上限", how: "第二次領取失敗（除非允許重複參加）" },
  { id: "8", title: "滿額訂單產生資格", how: "訂單 completed 後產生 claim" },
  { id: "9", title: "未達金額不產生", how: "低於門檻無券" },
  { id: "10", title: "同訂單不重複產生", how: "source_order_id + campaign 唯一" },
  { id: "11", title: "指定門市以外不能核銷", how: "/staff/redemptions 顯示不適用" },
  { id: "12", title: "同 QR 不能重複兌換", how: "第二次確認失敗" },
  { id: "13", title: "並行核銷只有一台成功", how: "雙裝置同時確認" },
  { id: "14", title: "重複掃描顯示原兌換資訊", how: "原門市／時間／編號" },
  { id: "15", title: "核銷後 QR 失效", how: "詳情頁不再產生 token" },
  { id: "16", title: "會員端同步已兌換", how: "/member/benefits/vouchers/[id]" },
  { id: "17", title: "取消訂單作廢未用資格", how: "spend-qualify 路徑" },
  { id: "18", title: "過期券不能兌換", how: "expired 或 RPC 擋下" },
  { id: "19", title: "成功／失敗有稽核", how: "核銷紀錄／報表失敗原因" },
  { id: "20", title: "TS／Lint／build", how: "npm run typecheck／build；npm run check:member-gifts" },
];

export default function MemberGiftsQaPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="會員禮驗收清單"
        description="規格 20 項業務驗收。建議先建立示範活動，再開健全檢查。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/member-gifts"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              返回儀表板
            </Link>
            <Link
              href="/api/admin/member-gifts/health"
              target="_blank"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              健全檢查
            </Link>
          </div>
        }
      />

      <div className="rounded-2xl border border-[#E7EAF0] bg-white p-4 text-sm text-[#687386]">
        <p>
          CLI：<code className="rounded bg-[#FFFDF6] px-1">npm run seed:member-gifts-demo</code>
          {" · "}
          <code className="rounded bg-[#FFFDF6] px-1">npm run check:member-gifts</code>
        </p>
        <p className="mt-2">
          完整說明見專案 <code className="rounded bg-[#FFFDF6] px-1">docs/MEMBER-GIFTS-QA.md</code>
        </p>
      </div>

      <ol className="space-y-2">
        {CHECKS.map((c) => (
          <li
            key={c.id}
            className="flex gap-3 rounded-2xl border border-[#E7EAF0] bg-white px-4 py-3"
          >
            <span className="w-8 shrink-0 text-sm font-bold text-[#153E73]">{c.id}.</span>
            <div>
              <p className="font-semibold text-[#153E73]">{c.title}</p>
              <p className="text-xs text-[#8A94A6]">{c.how}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
