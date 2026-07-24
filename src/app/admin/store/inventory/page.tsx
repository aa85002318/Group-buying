import { Suspense } from "react";
import { StoreRecordsClient } from "@/components/admin/store/StoreRecordsClient";

export default function StoreInventoryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#756B64]">載入中…</p>}>
      <StoreRecordsClient
        title="庫存管理"
        description="門市庫存彙總（store_inventory）與批次剩餘量"
        resource="inventory"
        createLabel="＋調整庫存"
        showBarcode
        fields={[
          { key: "quantity", label: "數量", type: "number", required: true },
          { key: "unit", label: "單位", type: "text" },
        ]}
      />
    </Suspense>
  );
}
