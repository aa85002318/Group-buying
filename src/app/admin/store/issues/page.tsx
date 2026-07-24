import { Suspense } from "react";
import { StoreRecordsClient } from "@/components/admin/store/StoreRecordsClient";

export default function StoreIssuesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#756B64]">載入中…</p>}>
      <StoreRecordsClient
        title="異常登記"
        description="異常寫入 store_anomalies（issue records）"
        resource="anomalies"
        createLabel="＋新增異常"
        fields={[
          {
            key: "anomaly_type",
            label: "異常類型",
            type: "select",
            required: true,
            options: [
              { value: "expiry", label: "效期" },
              { value: "damage", label: "損壞" },
              { value: "shortage", label: "短缺" },
              { value: "surplus", label: "多餘" },
              { value: "other", label: "其他" },
            ],
          },
          { key: "description", label: "說明", type: "text", required: true },
          { key: "quantity", label: "數量", type: "number" },
          {
            key: "status",
            label: "狀態",
            type: "select",
            options: [
              { value: "open", label: "待處理" },
              { value: "processing", label: "處理中" },
              { value: "resolved", label: "已解決" },
              { value: "closed", label: "結案" },
            ],
          },
        ]}
      />
    </Suspense>
  );
}
