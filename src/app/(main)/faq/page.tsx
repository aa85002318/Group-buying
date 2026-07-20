import { Suspense } from "react";
import type { Metadata } from "next";
import FaqClient from "./FaqClient";

export const metadata: Metadata = {
  title: "CHIMEIDIY 常見問題",
  description: "購物、團購、取貨、發票載具與 App 訂單相關 FAQ。",
};

export default function FaqPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-sm text-foreground-secondary">載入中…</p>}>
      <FaqClient />
    </Suspense>
  );
}
