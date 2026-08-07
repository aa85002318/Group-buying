"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { StoreQuickEntryForm } from "@/components/admin/store/StoreQuickEntryForm";

function EntryInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type");

  useEffect(() => {
    if (type === "worklog") router.replace("/admin/store#calendar");
    if (type === "request") router.replace("/admin/store/demand?type=restock");
  }, [type, router]);

  if (type === "worklog" || type === "request") {
    return <p className="text-sm text-muted-foreground">導向中…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#153E73]">商品處理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            異常／報廢／退貨／報修共用表單 · 寫入既有門市資料表 · 不另建商品主檔
          </p>
        </div>
        <Link href="/admin/store" className="text-sm font-semibold text-[#153E73] underline">
          回工作台
        </Link>
      </div>
      <StoreQuickEntryForm initialType={type} />
    </div>
  );
}

export default function StoreQuickEntryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">載入中…</p>}>
      <EntryInner />
    </Suspense>
  );
}
