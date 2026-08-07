import { Suspense } from "react";
import Link from "next/link";
import { StoreRecordsClient } from "@/components/admin/store/StoreRecordsClient";
import {
  ISSUE_ANOMALY_OPTIONS,
  ISSUE_STATUS_OPTIONS,
} from "@/lib/admin/store-entry";

export default function StoreIssuesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#756B64]">載入中…</p>}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          商品異常與報修紀錄列表。新增請走共用處理表單。
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/store/entry?type=issue"
            className="rounded-xl border border-[#FFE149] bg-[#FFE149] px-3 py-2 text-sm font-bold text-[#153E73]"
          >
            ＋商品異常
          </Link>
          <Link
            href="/admin/store/entry?type=repair"
            className="rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-sm font-semibold text-[#153E73]"
          >
            ＋商品報修
          </Link>
        </div>
      </div>
      <StoreRecordsClient
        title="異常／報修紀錄"
        description="包裝破損、短缺、效期異常與報修追蹤。批次選填。"
        resource="anomalies"
        createLabel="＋新增"
        requireBatch={false}
        fields={[
          {
            key: "anomaly_type",
            label: "類型",
            type: "select",
            required: true,
            options: [
              ...ISSUE_ANOMALY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              { value: "repair", label: "報修" },
              { value: "special", label: "特殊需求" },
            ],
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
            options: ISSUE_STATUS_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          },
        ]}
      />
    </Suspense>
  );
}
