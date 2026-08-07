import { Suspense } from "react";
import Link from "next/link";
import { StoreRecordsClient } from "@/components/admin/store/StoreRecordsClient";
import { RETURN_STATUS_OPTIONS, RETURN_TARGET_OPTIONS } from "@/lib/admin/store-entry";

export default function StoreReturnsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#756B64]">載入中…</p>}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          退貨紀錄列表。新增請走共用處理表單（退貨對象、預計退貨日）。
        </p>
        <Link
          href="/admin/store/entry?type=return"
          className="rounded-xl border border-[#FFE149] bg-[#FFE149] px-3 py-2 text-sm font-bold text-[#153E73]"
        >
          ＋商品退貨
        </Link>
      </div>
      <StoreRecordsClient
        title="退貨紀錄"
        description="退回廠商／總部／客戶入庫。批次選填。"
        resource="returns"
        createLabel="＋新增退貨"
        requireBatch={false}
        fields={[
          { key: "quantity", label: "數量", type: "number", required: true },
          { key: "reason", label: "原因", type: "text", required: true },
          {
            key: "return_target",
            label: "退貨對象",
            type: "select",
            options: RETURN_TARGET_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          },
          { key: "expected_return_date", label: "預計退貨日", type: "date" },
          { key: "invoice_no", label: "發票號碼", type: "text" },
          {
            key: "status",
            label: "狀態",
            type: "select",
            options: RETURN_STATUS_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          },
        ]}
      />
    </Suspense>
  );
}
