"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Barcode, Copy, Maximize2, Pencil, Trash2 } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { CarrierForm } from "@/components/member/CarrierForm";
import { InvoiceBarcode } from "@/components/member/InvoiceBarcode";
import { InvoiceBarcodeZoom } from "@/components/member/InvoiceBarcodeZoom";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/site-links";

type Carrier = {
  id: string;
  carrier_name: string | null;
  carrier_code: string;
};

export default function MemberCarrierPage() {
  const router = useRouter();
  const [carrier, setCarrier] = useState<Carrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "create" | "edit">("view");
  const [zoomOpen, setZoomOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [offline, setOffline] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOffline(true);
      setLoading(false);
      return;
    }
    setOffline(false);
    setLoading(true);
    fetch("/api/member/carrier")
      .then((r) => r.json())
      .then((d) => {
        setCarrier(d.carrier ?? null);
        setMode(d.carrier ? "view" : "create");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveCarrier = async (data: { carrier_name: string; carrier_code: string }) => {
    const method = carrier ? "PATCH" : "POST";
    const res = await fetch("/api/member/carrier", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "儲存失敗");
    setCarrier(json.carrier);
    setMode("view");
    setSuccessMessage(carrier ? "載具已更新" : "載具已新增");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const deleteCarrier = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/member/carrier", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "刪除失敗");
      setCarrier(null);
      setDeleteConfirm(false);
      setMode("create");
      setSuccessMessage("載具已刪除");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setDeleting(false);
    }
  };

  const copyBarcode = async () => {
    if (!carrier?.carrier_code) return;
    try {
      await navigator.clipboard.writeText(carrier.carrier_code);
      setCopyMessage("已複製手機條碼");
      setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      alert("無法複製，請長按條碼文字手動複製");
    }
  };

  return (
    <RequireAuth>
      <div className="space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.profile} className="text-caramel">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-caramel">我的發票載具</h1>
        </div>

        {successMessage && (
          <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{successMessage}</p>
        )}

        {loading ? (
          <p className="py-12 text-center text-foreground-secondary">載入中…</p>
        ) : offline && !carrier ? (
          <p className="rounded-[20px] bg-warning-soft px-4 py-6 text-center text-sm text-foreground">
            目前無法連線，請重新連線後開啟發票載具
          </p>
        ) : mode === "create" && !carrier ? (
          <div className="space-y-5">
            <div className="rounded-[20px] bg-surface p-8 text-center shadow-card">
              <Barcode className="mx-auto h-14 w-14 text-primary" strokeWidth={1.5} />
              <h2 className="mt-4 text-lg font-bold text-foreground">尚未設定發票載具</h2>
              <p className="mt-2 text-sm text-foreground-secondary">新增手機條碼後，結帳時可直接開啟出示</p>
            </div>
            <CarrierForm
              mode="create"
              onSubmit={saveCarrier}
              onCancel={() => router.push(APP_ROUTES.profile)}
            />
          </div>
        ) : mode === "edit" && carrier ? (
          <CarrierForm
            mode="edit"
            initialName={carrier.carrier_name ?? ""}
            initialCode={carrier.carrier_code}
            onSubmit={saveCarrier}
            onCancel={() => setMode("view")}
          />
        ) : carrier ? (
          <div className="space-y-4">
            <div className="rounded-[20px] bg-surface p-6 shadow-card">
              <p className="text-sm font-medium text-foreground-secondary">{carrier.carrier_name ?? "我的手機條碼"}</p>
              <div className="mt-4 flex justify-center rounded-[20px] bg-surface px-4 py-6">
                <InvoiceBarcode value={carrier.carrier_code} />
              </div>
              <button
                type="button"
                onClick={copyBarcode}
                className="mt-3 w-full text-center font-mono text-sm tracking-wider text-caramel underline-offset-2 hover:underline"
              >
                {carrier.carrier_code}
              </button>
              {copyMessage && <p className="mt-2 text-center text-xs text-green-700">{copyMessage}</p>}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={copyBarcode}
                variant="outline"
                className="min-h-11 flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                複製條碼
              </Button>
              <Button
                type="button"
                onClick={() => setZoomOpen(true)}
                className="min-h-11 flex-1 bg-caramel hover:bg-caramel-hover"
              >
                <Maximize2 className="mr-2 h-4 w-4" />
                放大條碼
              </Button>
              <Button type="button" variant="outline" onClick={() => setMode("edit")} className="min-h-11 flex-1">
                <Pencil className="mr-2 h-4 w-4" />
                編輯載具
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirm(true)}
                className="min-h-11 flex-1 border-error text-error hover:bg-error-soft"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                刪除載具
              </Button>
            </div>

            <div className="rounded-[20px] bg-surface-soft p-4 text-sm text-foreground-secondary">
              <p className="font-medium text-caramel">使用提醒</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>結帳前請確認條碼清晰可掃</li>
                <li>建議將螢幕亮度調高後出示</li>
                <li>此功能僅儲存及顯示您的手機條碼</li>
              </ul>
            </div>
          </div>
        ) : null}

        <div className="space-y-2 rounded-[20px] border border-border bg-surface p-4 text-xs leading-relaxed text-foreground-secondary">
          <p>
            此功能僅協助您儲存及顯示發票手機條碼，方便門市結帳時出示，不代表已完成財政部手機條碼申請或歸戶。
          </p>
          <p>尚未申請手機條碼者，請先至財政部電子發票整合服務平台申請。</p>
        </div>

        {deleteConfirm && (
          <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <div className="w-full max-w-sm rounded-[20px] bg-surface p-6 shadow-xl">
              <h3 className="text-lg font-bold text-foreground">確定刪除發票載具？</h3>
              <p className="mt-2 text-sm text-foreground-secondary">刪除後需要重新輸入手機條碼，才能再次使用。</p>
              <div className="mt-6 flex gap-3">
                <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={() => setDeleteConfirm(false)} disabled={deleting}>
                  取消
                </Button>
                <Button type="button" className="min-h-11 flex-1 bg-error hover:opacity-90" onClick={deleteCarrier} disabled={deleting}>
                  {deleting ? "刪除中…" : "確定刪除"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <InvoiceBarcodeZoom
          open={zoomOpen}
          value={carrier?.carrier_code ?? ""}
          onClose={() => setZoomOpen(false)}
          onCopy={carrier ? copyBarcode : undefined}
        />
      </div>
    </RequireAuth>
  );
}
