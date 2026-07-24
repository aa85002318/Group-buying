import { Suspense } from "react";
import { StoreRecordsClient } from "@/components/admin/store/StoreRecordsClient";

export default function StoreDisposalsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#756B64]">載入中…</p>}>
      <StoreRecordsClient
        title="報廢管理"
        description="掃條碼 → 選商品 → 選批次 → 報廢。不得直接報廢商品（必須 batch_id）。"
        resource="disposals"
        createLabel="＋新增報廢"
        requireBatch
        fields={[
          { key: "quantity", label: "數量", type: "number", required: true },
          { key: "unit_cost", label: "單位成本", type: "number" },
          { key: "reason", label: "原因", type: "text", required: true },
          {
            key: "status",
            label: "狀態",
            type: "select",
            options: [
              { value: "open", label: "待處理" },
              { value: "approved", label: "已核准" },
              { value: "completed", label: "已完成" },
            ],
          },
        ]}
      />
    </Suspense>
  );
}
