"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { AdminBarcodeInput, type BarcodeProduct } from "@/components/admin/store/AdminBarcodeInput";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { StoreManualProductAdd } from "@/components/admin/store/StoreManualProductAdd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DISPOSAL_STATUS_OPTIONS,
  ISSUE_RETURN_CASE_OPTIONS,
  ISSUE_RETURN_STATUS_OPTIONS,
  REPAIR_STATUS_OPTIONS,
  STORE_ENTRY_TYPES,
  getStoreEntryDef,
  type StoreEntryType,
} from "@/lib/admin/store-entry";
import { cn } from "@/lib/utils";

type BatchOption = {
  id: string;
  batch_no: string;
  remaining_quantity?: number | null;
  quantity?: number | null;
  expiry_date?: string | null;
  location?: string | null;
};

export function StoreQuickEntryForm({
  initialType,
}: {
  initialType?: string | null;
}) {
  const router = useRouter();
  const resolvedInitial = getStoreEntryDef(initialType)?.id ?? null;
  const [step, setStep] = useState<"pick" | "form">(resolvedInitial ? "form" : "pick");
  const [type, setType] = useState<StoreEntryType | null>(resolvedInitial);
  const def = getStoreEntryDef(type);

  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [caseKind, setCaseKind] = useState("customer_return");
  const [status, setStatus] = useState("pending");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [location, setLocation] = useState("");
  const [productExpiry, setProductExpiry] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  // repair
  const [receivedAt, setReceivedAt] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [piecesCount, setPiecesCount] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ message: string; href?: string } | null>(null);

  const showOptionalBatch =
    Boolean(productId) &&
    Boolean(def) &&
    (def!.id === "issue_return" ||
      def!.id === "disposal" ||
      def!.id === "repair" ||
      def!.id === "special");

  useEffect(() => {
    if (!productId || !showOptionalBatch) {
      setBatches([]);
      return;
    }
    fetch(`/api/admin/store/batches?product_id=${productId}&status=active`)
      .then((r) => r.json())
      .then((d) => setBatches(d.batches ?? []))
      .catch(() => setBatches([]));
  }, [productId, showOptionalBatch]);

  const resetFields = () => {
    setProductId(null);
    setProductName(null);
    setBatchId(null);
    setQuantity("");
    setReason("");
    setPhotos([]);
    setCaseKind("customer_return");
    setStatus("pending");
    setInvoiceNo("");
    setLocation("");
    setProductExpiry("");
    setReceivedAt("");
    setCustomerName("");
    setCustomerPhone("");
    setPiecesCount("");
    setVendorName("");
  };

  const pickType = (id: StoreEntryType) => {
    setType(id);
    setStep("form");
    setDone(null);
    setError(null);
    resetFields();
    if (id === "repair") setStatus("notified_vendor");
    else if (id === "disposal") setStatus("pending");
    else setStatus("pending");
  };

  const onBarcode = (product: BarcodeProduct) => {
    setProductId(product.id);
    setProductName(product.name);
    setBatchId(null);
  };

  const submit = async () => {
    if (!type || !def) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          product_id: productId,
          product_name: productName,
          product_label: productName,
          batch_id: batchId,
          quantity: quantity ? Number(quantity) : null,
          reason,
          description: reason,
          anomaly_type: type === "issue_return" ? caseKind : def.anomalyType,
          case_kind: type === "issue_return" ? caseKind : null,
          status,
          invoice_no: invoiceNo || null,
          location: location || null,
          product_expiry: productExpiry || null,
          photo_url: photos[0] ?? null,
          photo_urls: photos,
          received_at: receivedAt || null,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          pieces_count: piecesCount ? Number(piecesCount) : null,
          vendor_name: vendorName || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送出失敗");

      const href =
        data.resource === "disposals"
          ? "/admin/store/disposals"
          : data.resource === "returns" || data.resource === "anomalies" || data.resource === "issue_return"
            ? "/admin/store/issues"
          : data.resource === "store_messages"
                ? "/admin/store#messages"
                : "/admin/store";

      setDone({ message: data.message ?? "已送出", href });
      resetFields();
      if (type === "repair") setStatus("notified_vendor");
      else if (type === "disposal") setStatus("pending");
      else setStatus("pending");
    } catch (e) {
      setError(e instanceof Error ? e.message : "送出失敗");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-[14px] border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="text-lg font-bold text-[#153E73]">{done.message}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            className="border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73]"
            onClick={() => {
              setDone(null);
              setStep("pick");
              setType(null);
            }}
          >
            再新增一筆
          </Button>
          {done.href ? (
            <Link href={done.href}>
              <Button type="button" variant="outline">
                查看列表
              </Button>
            </Link>
          ) : null}
          <Button type="button" variant="outline" onClick={() => router.push("/admin/store")}>
            回工作台
          </Button>
        </div>
      </div>
    );
  }

  if (step === "pick" || !def) {
    return (
      <div className="mx-auto max-w-lg space-y-3">
        <p className="text-sm text-muted-foreground">選擇要登記的類型</p>
        <div className="grid gap-2">
          {STORE_ENTRY_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => pickType(t.id)}
              className="rounded-[14px] border border-[#E7EAF0] bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-[#FFE149] hover:bg-[#FFFBEA]"
            >
              <span className="block text-[15px] font-bold text-[#153E73]">{t.label}</span>
              <span className="mt-0.5 block text-[12px] text-muted-foreground">
                {t.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const showProduct = def.requiresProduct || Boolean(def.optionalProduct);
  const isIssueReturn = def.id === "issue_return";
  const isRepair = def.id === "repair";
  const isDisposal = def.id === "disposal";
  const showServiceFields = isIssueReturn || isDisposal || isRepair;
  const showPhotos = def.resource !== "store_messages";

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#153E73]"
        onClick={() => {
          setStep("pick");
          setType(null);
        }}
      >
        <ChevronLeft className="h-4 w-4" />
        重選類型
      </button>

      <div className="rounded-[14px] border border-[#FFE149]/60 bg-[#FFFBEA] px-4 py-3">
        <p className="text-base font-bold text-[#153E73]">{def.label}</p>
        <p className="text-[12px] text-[#153E73]/70">{def.description}</p>
      </div>

      <div className="space-y-4 rounded-[14px] border border-[#E7EAF0] bg-white p-4 shadow-sm">
        {showProduct ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#153E73]">商品</p>
            <AdminBarcodeInput onSelect={onBarcode} autoFocus />
            {productName ? (
              <p className="text-sm text-[#153E73]">
                已選：
                <Link
                  href={`/admin/products/${productId}/edit`}
                  className="ml-1 font-semibold underline"
                >
                  {productName}
                </Link>
              </p>
            ) : def.requiresProduct ? (
              <p className="text-xs text-amber-800">請掃描條碼，或下方手動新增商品</p>
            ) : (
              <p className="text-xs text-muted-foreground">可選：有商品再掃碼</p>
            )}
            <StoreManualProductAdd onCreated={onBarcode} />
          </div>
        ) : null}

        {showOptionalBatch ? (
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-[#153E73]">批次（選填）</span>
            <select
              className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
              value={batchId ?? ""}
              onChange={(e) => setBatchId(e.target.value || null)}
            >
              <option value="">不指定批次</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_no}
                  {b.expiry_date ? ` · ${b.expiry_date}` : ""}
                  {` · 剩 ${b.remaining_quantity ?? b.quantity ?? 0}`}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {isIssueReturn ? (
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-[#153E73]">類型</span>
            <select
              className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
              value={caseKind}
              onChange={(e) => setCaseKind(e.target.value)}
            >
              {ISSUE_RETURN_CASE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {(isIssueReturn || def.requiresQuantity || def.requiresProduct) && !isRepair ? (
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-[#153E73]">
              數量{def.requiresQuantity || isIssueReturn ? "（必填）" : "（選填）"}
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              className="h-11 rounded-xl"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="例如 1"
            />
          </label>
        ) : null}

        {isRepair ? (
          <div className="space-y-3 rounded-xl border border-[#E9DED4] bg-[#FFFCF7] p-3">
            <p className="text-sm font-bold text-[#153E73]">客戶資料</p>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">收件時間</span>
              <Input
                type="datetime-local"
                className="h-11 rounded-xl"
                value={receivedAt}
                onChange={(e) => setReceivedAt(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">姓名</span>
              <Input
                className="h-11 rounded-xl"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">電話</span>
              <Input
                className="h-11 rounded-xl"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">發票號碼</span>
              <Input
                className="h-11 rounded-xl"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">帶回件數登記</span>
              <Input
                type="number"
                min={0}
                className="h-11 rounded-xl"
                value={piecesCount}
                onChange={(e) => setPiecesCount(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">廠商</span>
              <Input
                className="h-11 rounded-xl"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </label>
          </div>
        ) : null}

        {showServiceFields && !isRepair ? (
          <>
            {!isDisposal ? (
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold text-[#153E73]">發票號碼（選填）</span>
                <Input
                  className="h-11 rounded-xl"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
              </label>
            ) : null}
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold text-[#153E73]">擺放位置（選填）</span>
              <Input
                className="h-11 rounded-xl"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例如 冷藏 A3"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold text-[#153E73]">產品效期（選填）</span>
              <Input
                type="date"
                className="h-11 rounded-xl"
                value={productExpiry}
                onChange={(e) => setProductExpiry(e.target.value)}
              />
            </label>
          </>
        ) : null}

        {isIssueReturn ? (
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-[#153E73]">狀態</span>
            <select
              className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {ISSUE_RETURN_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {isRepair ? (
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-[#153E73]">狀態</span>
            <select
              className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {REPAIR_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-muted-foreground">
              送出後會記錄變更時間並保留軌跡
            </span>
          </label>
        ) : null}

        {isDisposal ? (
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-[#153E73]">狀態</span>
            <select
              className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {DISPOSAL_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold text-[#153E73]">
            {isRepair ? "說明欄位（必填）" : "原因／說明（必填）"}
          </span>
          <textarea
            className="min-h-[100px] w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              def.id === "message"
                ? "寫下要告訴同事的話"
                : "簡短說明即可"
            }
          />
        </label>

        {showPhotos ? (
          <AdminImageUpload
            images={photos}
            onChange={setPhotos}
            multiple
            maxImages={8}
            label="照片（可多張）"
            hint="可拍現場／商品照片"
            uploadFolder="store-ops"
            bucket="product-images"
          />
        ) : null}

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          disabled={saving}
          className={cn(
            "h-12 w-full text-base font-bold",
            "border-[#FFE149] bg-[#FFE149] text-[#153E73] hover:bg-[#FFE149]/90"
          )}
          onClick={() => void submit()}
        >
          {saving ? "送出中…" : "送出"}
        </Button>
      </div>
    </div>
  );
}
