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
  DISPOSAL_REASON_OPTIONS,
  DISPOSAL_STATUS_OPTIONS,
  ISSUE_ANOMALY_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  PRODUCT_HANDLING_FLOW_STEPS,
  PRODUCT_HANDLING_TYPES,
  REPAIR_STATUS_OPTIONS,
  REPAIR_URGENCY_OPTIONS,
  RETURN_STATUS_OPTIONS,
  RETURN_TARGET_OPTIONS,
  STORE_ENTRY_OTHER_TYPES,
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
  const [note, setNote] = useState("");
  const [caseKind, setCaseKind] = useState("damage");
  const [status, setStatus] = useState("pending");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [location, setLocation] = useState("");
  const [productExpiry, setProductExpiry] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [assigneeName, setAssigneeName] = useState("");
  const [pauseSales, setPauseSales] = useState(false);
  const [managerConfirmed, setManagerConfirmed] = useState(false);
  const [disposalReasonCode, setDisposalReasonCode] = useState("expired");
  const [returnTarget, setReturnTarget] = useState("supplier");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [affectsOperations, setAffectsOperations] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
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
    (def!.id === "issue" ||
      def!.id === "disposal" ||
      def!.id === "return" ||
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
    setNote("");
    setPhotos([]);
    setCaseKind("damage");
    setStatus("pending");
    setInvoiceNo("");
    setLocation("");
    setProductExpiry("");
    setAssigneeName("");
    setPauseSales(false);
    setManagerConfirmed(false);
    setDisposalReasonCode("expired");
    setReturnTarget("supplier");
    setExpectedReturnDate("");
    setUrgency("normal");
    setAffectsOperations(false);
    setConfirmed(false);
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
    else if (id === "return") setStatus("pending");
    else setStatus("pending");
  };

  const onBarcode = (product: BarcodeProduct) => {
    setProductId(product.id);
    setProductName(product.name);
    setBatchId(null);
  };

  const submit = async () => {
    if (!type || !def) return;
    if (!confirmed && def.group === "product") {
      setError("請勾選「確認處理」後再送出");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const description =
        def.id === "repair"
          ? reason
          : [reason, note.trim() ? `備註：${note.trim()}` : ""].filter(Boolean).join("\n");

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
          reason: description || reason,
          description: description || reason,
          anomaly_type: type === "issue" ? caseKind : def.anomalyType,
          case_kind: type === "issue" ? caseKind : type === "return" ? "customer_return" : null,
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
          assignee_name: assigneeName || null,
          pause_sales: pauseSales,
          manager_confirmed: managerConfirmed,
          disposal_reason_code: disposalReasonCode || null,
          return_target: returnTarget || null,
          expected_return_date: expectedReturnDate || null,
          urgency: urgency || null,
          affects_operations: affectsOperations,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送出失敗");

      const href =
        data.resource === "disposals"
          ? "/admin/store/disposals"
          : data.resource === "returns"
            ? "/admin/store/returns"
            : data.resource === "anomalies" || data.resource === "issue_return"
              ? type === "repair"
                ? "/admin/store/issues?filter=repair"
                : "/admin/store/issues"
              : data.resource === "store_messages"
                ? "/admin/store#messages"
                : "/admin/store";

      setDone({ message: data.message ?? "已送出", href });
      resetFields();
      if (type === "repair") setStatus("notified_vendor");
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
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-[14px] border border-[#FFE149]/60 bg-[#FFFBEA] px-4 py-3">
          <p className="text-sm font-bold text-[#153E73]">商品處理流程</p>
          <p className="mt-1 text-[12px] text-[#153E73]/70">
            {PRODUCT_HANDLING_FLOW_STEPS.join(" → ")}
          </p>
        </div>
        <p className="text-sm font-semibold text-[#153E73]">1. 選擇處理類型</p>
        <div className="grid gap-2">
          {PRODUCT_HANDLING_TYPES.map((t) => (
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
        <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-[#153E73]/45">
          其他
        </p>
        <div className="grid gap-2">
          {STORE_ENTRY_OTHER_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => pickType(t.id)}
              className="rounded-[14px] border border-dashed border-[#E7EAF0] bg-white px-4 py-3 text-left transition hover:border-[#FFE149] hover:bg-[#FFFBEA]"
            >
              <span className="block text-[14px] font-semibold text-[#153E73]">{t.label}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {t.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const showProduct = def.requiresProduct || Boolean(def.optionalProduct);
  const isIssue = def.id === "issue";
  const isRepair = def.id === "repair";
  const isDisposal = def.id === "disposal";
  const isReturn = def.id === "return";
  const isProductHandling = def.group === "product";
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
            <p className="text-sm font-semibold text-[#153E73]">2. 掃描／選擇商品</p>
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

        {(isIssue || isReturn || isDisposal || def.requiresQuantity) && !isRepair ? (
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-[#153E73]">3. 數量（必填）</span>
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

        {/* —— Type-specific —— */}
        {isIssue ? (
          <div className="space-y-3 rounded-xl border border-[#E7EAF0] bg-[#F7F8FA] p-3">
            <p className="text-sm font-bold text-[#153E73]">4. 異常細節</p>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">異常類型</span>
              <select
                className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
                value={caseKind}
                onChange={(e) => setCaseKind(e.target.value)}
              >
                {ISSUE_ANOMALY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-[#153E73]">
              <input
                type="checkbox"
                checked={pauseSales}
                onChange={(e) => setPauseSales(e.target.checked)}
                className="h-4 w-4 rounded border-[#E7EAF0]"
              />
              暫停銷售此商品（僅紀錄，不改商品主檔上架）
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">狀態</span>
              <select
                className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {ISSUE_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {isDisposal ? (
          <div className="space-y-3 rounded-xl border border-[#E7EAF0] bg-[#F7F8FA] p-3">
            <p className="text-sm font-bold text-[#153E73]">4. 報廢細節</p>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">報廢原因</span>
              <select
                className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
                value={disposalReasonCode}
                onChange={(e) => {
                  setDisposalReasonCode(e.target.value);
                  const label =
                    DISPOSAL_REASON_OPTIONS.find((o) => o.value === e.target.value)?.label ?? "";
                  if (!reason.trim()) setReason(label);
                }}
              >
                {DISPOSAL_REASON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">效期</span>
              <Input
                type="date"
                className="h-11 rounded-xl"
                value={productExpiry}
                onChange={(e) => setProductExpiry(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-[#153E73]">
              <input
                type="checkbox"
                checked={managerConfirmed}
                onChange={(e) => setManagerConfirmed(e.target.checked)}
                className="h-4 w-4 rounded border-[#E7EAF0]"
              />
              主管已確認報廢
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">狀態</span>
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
          </div>
        ) : null}

        {isReturn ? (
          <div className="space-y-3 rounded-xl border border-[#E7EAF0] bg-[#F7F8FA] p-3">
            <p className="text-sm font-bold text-[#153E73]">4. 退貨細節</p>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">退貨對象</span>
              <select
                className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
                value={returnTarget}
                onChange={(e) => setReturnTarget(e.target.value)}
              >
                {RETURN_TARGET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">預計退貨日</span>
              <Input
                type="date"
                className="h-11 rounded-xl"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">狀態</span>
              <select
                className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {RETURN_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {isRepair ? (
          <div className="space-y-3 rounded-xl border border-[#E9DED4] bg-[#FFFCF7] p-3">
            <p className="text-sm font-bold text-[#153E73]">4. 報修細節</p>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">緊急程度</span>
              <select
                className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              >
                {REPAIR_URGENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-[#153E73]">
              <input
                type="checkbox"
                checked={affectsOperations}
                onChange={(e) => setAffectsOperations(e.target.checked)}
                className="h-4 w-4 rounded border-[#E7EAF0]"
              />
              是否影響營運
            </label>
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
              <span className="font-medium text-[#153E73]">客戶姓名</span>
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
              <span className="font-medium text-[#153E73]">帶回件數</span>
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
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">狀態</span>
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
            </label>
          </div>
        ) : null}

        {(isIssue || isReturn) && !isDisposal ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold text-[#153E73]">發票號碼（選填）</span>
              <Input
                className="h-11 rounded-xl"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold text-[#153E73]">擺放位置（選填）</span>
              <Input
                className="h-11 rounded-xl"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例如 冷藏 A3"
              />
            </label>
            {isIssue ? (
              <label className="block space-y-1.5 text-sm sm:col-span-2">
                <span className="font-semibold text-[#153E73]">產品效期（選填）</span>
                <Input
                  type="date"
                  className="h-11 rounded-xl"
                  value={productExpiry}
                  onChange={(e) => setProductExpiry(e.target.value)}
                />
              </label>
            ) : null}
          </div>
        ) : null}

        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold text-[#153E73]">
            {isRepair ? "故障說明（必填）" : "原因／說明（必填）"}
          </span>
          <textarea
            className="min-h-[88px] w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              def.id === "message"
                ? "寫下要告訴同事的話"
                : isRepair
                  ? "簡述故障現象"
                  : "簡短說明即可"
            }
          />
        </label>

        {showPhotos ? (
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-[#153E73]">5. 拍照上傳</p>
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
          </div>
        ) : null}

        {isProductHandling ? (
          <div className="space-y-3 rounded-xl border border-[#E7EAF0] bg-[#F7F8FA] p-3">
            <p className="text-sm font-bold text-[#153E73]">6. 備註與負責人</p>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">負責人</span>
              <Input
                className="h-11 rounded-xl"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                placeholder="誰負責跟進"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[#153E73]">備註（選填）</span>
              <textarea
                className="min-h-[64px] w-full rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          </div>
        ) : null}

        {isProductHandling ? (
          <label className="flex items-start gap-2 rounded-xl border border-[#FFE149]/70 bg-[#FFFBEA] px-3 py-3 text-sm font-semibold text-[#153E73]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#E7EAF0]"
            />
            <span>7. 確認處理 — 資料正確，送出登記（不建立第二份商品主檔）</span>
          </label>
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

        <p className="text-center text-[11px] text-muted-foreground">
          類型代碼：{def.id} · 共 {STORE_ENTRY_TYPES.length} 種表單入口
        </p>
      </div>
    </div>
  );
}
