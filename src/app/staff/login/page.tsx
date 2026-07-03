import { Suspense } from "react";
import StaffLoginClient from "./StaffLoginClient";

export default function StaffLoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">載入中…</div>}>
      <StaffLoginClient />
    </Suspense>
  );
}
