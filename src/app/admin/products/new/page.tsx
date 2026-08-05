import { Suspense } from "react";
import { AdminProductNewClient } from "./AdminProductNewClient";

export default function AdminProductNewPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#8A94A6]">載入中…</p>}>
      <AdminProductNewClient />
    </Suspense>
  );
}
