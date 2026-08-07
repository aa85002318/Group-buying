"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StoreStockLookup } from "@/components/admin/store/StoreStockLookup";

function InventoryInner() {
  const search = useSearchParams();
  const initialQ = search.get("q") ?? "";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#153E73]">分店庫存查詢</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            搜尋／掃碼查看各分店庫存與可供應數量。僅供查詢，不可直接改其他分店庫存。
          </p>
        </div>
        <Link href="/admin/store" className="text-sm font-semibold text-[#153E73] underline">
          回工作台
        </Link>
      </div>

      <div className="rounded-2xl border border-[#E7EAF0] bg-white p-4 shadow-[0_4px_14px_rgba(21,62,115,0.05)] md:p-5">
        <StoreStockLookup initialQuery={initialQ} />
      </div>

      <p className="text-xs text-[#687386]">
        需要調貨時請建立「分店貨品需求」，來源門市回覆後再安排交接。
        <Link href="/admin/store/demand?type=restock" className="ml-1 font-semibold underline">
          前往分店需求
        </Link>
      </p>
    </div>
  );
}

/** Cross-store stock lookup (read-only). Replaces old redirect-to-demand. */
export default function StoreInventoryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">載入中…</p>}>
      <InventoryInner />
    </Suspense>
  );
}
