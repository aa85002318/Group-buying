"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/site-links";

export default function DataExportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const download = async () => {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/member/data-export");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "匯出失敗");

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chimeidiy-personal-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setPreview(
        `已匯出：個人資料、地址 ${data.addresses?.length ?? 0} 筆、訂單 ${data.orders?.length ?? 0} 筆、同意紀錄 ${data.consents?.length ?? 0} 筆。`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "匯出失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.memberSettings}>
            <ArrowLeft className="h-5 w-5 text-caramel" />
          </Link>
          <h1 className="text-xl font-bold text-caramel">個資下載／查詢</h1>
        </div>

        <div className="space-y-4 rounded-[20px] bg-surface p-5 shadow-card">
          <p className="text-sm text-foreground-secondary">
            您可下載帳號相關個人資料副本（JSON），包含會員資料、收件地址、訂單摘要、收藏與同意紀錄。
          </p>
          <Button className="min-h-11 w-full gap-2" disabled={loading} onClick={download}>
            <Download className="h-4 w-4" />
            {loading ? "匯出中…" : "下載個人資料"}
          </Button>
          {error && <p className="text-sm text-error">{error}</p>}
          {preview && <p className="text-sm text-green-700">{preview}</p>}
        </div>
      </div>
    </RequireAuth>
  );
}
