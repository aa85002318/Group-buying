import { Suspense } from "react";
import { StoreRecordsClient } from "@/components/admin/store/StoreRecordsClient";

export default function StoreExpiryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#756B64]">載入中…</p>}>
      <StoreRecordsClient
        title="效期管理"
        description="以批次顯示效期。商品＋批號＋剩餘＋天數；點「查看批次」進入批次詳情。"
        resource="batches"
        createLabel="＋新增效期批次"
        expiryColumns
        fields={[
          { key: "quantity", label: "數量", type: "number", required: true },
          { key: "expiry_date", label: "效期", type: "date", required: true },
          { key: "batch_no", label: "批號", type: "text" },
          { key: "barcode", label: "批次條碼", type: "text" },
          { key: "location", label: "儲位", type: "text" },
          { key: "notes", label: "備註", type: "text" },
        ]}
      />
    </Suspense>
  );
}
