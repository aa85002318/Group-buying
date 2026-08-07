"use client";

import { Suspense } from "react";
import { MemberGiftsHubClient } from "@/components/member/gifts/MemberGiftsHubClient";

export default function MemberBenefitsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#687386]">載入中…</div>}>
      <MemberGiftsHubClient initialTab="monthly" />
    </Suspense>
  );
}
