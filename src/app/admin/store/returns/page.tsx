import { Suspense } from "react";
import { StoreRecordsClient } from "@/components/admin/store/StoreRecordsClient";

export default function StoreReturnsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#756B64]">載入中…</p>}>
      <StoreRecordsClient
        title="退貨管理"
        description="退貨寫入 store_returns，關聯 product_id"
        resource="returns"
        createLabel="＋新增退貨"
        fields={[
          { key: "quantity", label: "數量", type: "number", required: true },
          { key: "reason", label: "原因", type: "text", required: true },
          { key: "return_number", label: "退貨單號", type: "text" },
          {
            key: "status",
            label: "狀態",
            type: "select",
            options: [
              { value: "open", label: "待處理" },
              { value: "approved", label: "已核准" },
              { value: "rejected", label: "已拒絕" },
              { value: "completed", label: "已完成" },
            ],
          },
        ]}
      />
    </Suspense>
  );
}
