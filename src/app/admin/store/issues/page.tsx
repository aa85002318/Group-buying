import { Suspense } from "react";
import Link from "next/link";
import { StoreRecordsClient } from "@/components/admin/store/StoreRecordsClient";
import {
  ISSUE_RETURN_CASE_OPTIONS,
  ISSUE_RETURN_STATUS_OPTIONS,
} from "@/lib/admin/store-entry";

export default function StoreIssuesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#756B64]">載入中…</p>}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          異常與退貨已整合為同一表單；此處為列表檢視。
        </p>
        <Link
          href="/admin/store/entry?type=issue_return"
          className="rounded-xl border border-[#FFE149] bg-[#FFE149] px-3 py-2 text-sm font-bold text-[#153E73]"
        >
          ＋異常／退貨登記
        </Link>
      </div>
      <StoreRecordsClient
        title="異常／退貨紀錄"
        description="客戶退貨、到貨異常等。批次選填；含狀態與照片。"
        resource="anomalies"
        createLabel="＋新增"
        requireBatch={false}
        fields={[
          {
            key: "anomaly_type",
            label: "類型",
            type: "select",
            required: true,
            options: ISSUE_RETURN_CASE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          },
          { key: "description", label: "原因", type: "text", required: true },
          { key: "quantity", label: "數量", type: "number" },
          { key: "invoice_no", label: "發票號碼", type: "text" },
          { key: "location", label: "擺放位置", type: "text" },
          { key: "product_expiry", label: "產品效期", type: "date" },
          {
            key: "status",
            label: "狀態",
            type: "select",
            options: ISSUE_RETURN_STATUS_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          },
        ]}
      />
    </Suspense>
  );
}
