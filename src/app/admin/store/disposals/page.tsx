import { Suspense } from "react";
import Link from "next/link";
import { StoreRecordsClient } from "@/components/admin/store/StoreRecordsClient";
import { DISPOSAL_STATUS_OPTIONS } from "@/lib/admin/store-entry";

export default function StoreDisposalsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#756B64]">載入中…</p>}>
      <div className="mb-3">
        <Link
          href="/admin/store/entry?type=disposal"
          className="inline-flex rounded-xl border border-[#FFE149] bg-[#FFE149] px-3 py-2 text-sm font-bold text-[#153E73]"
        >
          ＋報廢登記
        </Link>
      </div>
      <StoreRecordsClient
        title="報廢管理"
        description="批次選填；狀態：已報廢／待處理／廠商退回；可填個別效期。"
        resource="disposals"
        createLabel="＋新增報廢"
        requireBatch={false}
        fields={[
          { key: "quantity", label: "數量", type: "number", required: true },
          { key: "unit_cost", label: "單位成本", type: "number" },
          { key: "reason", label: "原因", type: "text", required: true },
          { key: "product_expiry", label: "產品效期", type: "date" },
          {
            key: "status",
            label: "狀態",
            type: "select",
            options: DISPOSAL_STATUS_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          },
        ]}
      />
    </Suspense>
  );
}
