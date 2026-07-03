import { Suspense } from "react";
import StaffPickupScanClient from "./StaffPickupScanClient";

export default function StaffPickupScanPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-muted-foreground">載入中...</div>}>
      <StaffPickupScanClient />
    </Suspense>
  );
}
