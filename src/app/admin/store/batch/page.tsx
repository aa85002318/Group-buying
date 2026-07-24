"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminBarcodeInput, type BarcodeProduct } from "@/components/admin/store/AdminBarcodeInput";
import { AdminImportPreview } from "@/components/admin/store/AdminImportPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Tab = "expiry" | "disposal" | "import" | "scan";

type ExpiryRow = {
  key: string;
  barcode: string;
  product_id: string;
  product_name: string;
  quantity: string;
  expiry_date: string;
  batch_no: string;
  supplier_id: string;
};

type DisposalRow = {
  key: string;
  product_id: string;
  product_name: string;
  quantity: string;
  reason: string;
  unit_cost: string;
};

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function BatchPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "expiry";
  const [tab, setTab] = useState<Tab>(
    ["expiry", "disposal", "import", "scan"].includes(initialTab) ? initialTab : "expiry"
  );
  const [expiryRows, setExpiryRows] = useState<ExpiryRow[]>([]);
  const [disposalRows, setDisposalRows] = useState<DisposalRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tabs: Array<{ id: Tab; label: string }> = useMemo(
    () => [
      { id: "expiry", label: "效期批次登記" },
      { id: "disposal", label: "報廢批次登記" },
      { id: "import", label: "Excel 匯入" },
      { id: "scan", label: "條碼掃描" },
    ],
    []
  );

  const addExpiryFromProduct = (product: BarcodeProduct) => {
    setExpiryRows((prev) => {
      const existing = prev.find((r) => r.product_id === product.id);
      if (existing) {
        const ok = window.confirm("此商品已在目前批次中，是否累加數量？");
        if (!ok) return prev;
        return prev.map((r) =>
          r.key === existing.key
            ? { ...r, quantity: String(Number(r.quantity || 0) + 1) }
            : r
        );
      }
      return [
        ...prev,
        {
          key: newKey(),
          barcode: product.barcode ?? "",
          product_id: product.id,
          product_name: product.name,
          quantity: "1",
          expiry_date: "",
          batch_no: "",
          supplier_id: product.supplier_id ?? "",
        },
      ];
    });
    setTab("expiry");
  };

  const addDisposalFromProduct = (product: BarcodeProduct) => {
    setDisposalRows((prev) => {
      const existing = prev.find((r) => r.product_id === product.id);
      if (existing) {
        const ok = window.confirm("此商品已在目前報廢批次中，是否累加數量？");
        if (!ok) return prev;
        return prev.map((r) =>
          r.key === existing.key
            ? { ...r, quantity: String(Number(r.quantity || 0) + 1) }
            : r
        );
      }
      return [
        ...prev,
        {
          key: newKey(),
          product_id: product.id,
          product_name: product.name,
          quantity: "1",
          reason: "",
          unit_cost: product.cost_price != null ? String(product.cost_price) : "",
        },
      ];
    });
    setTab("disposal");
  };

  const submitExpiry = async () => {
    setSubmitting(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "expiry",
          rows: expiryRows.map((r) => ({
            product_id: r.product_id,
            barcode: r.barcode || undefined,
            quantity: Number(r.quantity),
            expiry_date: r.expiry_date || null,
            batch_no: r.batch_no || undefined,
            supplier_id: r.supplier_id || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送出失敗");
      setMsg(`成功 ${data.success} 筆，失敗 ${data.failed} 筆`);
      if (data.success) setExpiryRows([]);
      if (data.errors?.length) {
        setError(data.errors.map((e: { row: number; message: string }) => `第 ${e.row} 列：${e.message}`).join("；"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "送出失敗");
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisposal = async () => {
    setSubmitting(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "disposal",
          rows: disposalRows.map((r) => ({
            product_id: r.product_id,
            quantity: Number(r.quantity),
            reason: r.reason || null,
            unit_cost: r.unit_cost ? Number(r.unit_cost) : null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送出失敗");
      setMsg(`成功 ${data.success} 筆，失敗 ${data.failed} 筆`);
      if (data.success) setDisposalRows([]);
      if (data.errors?.length) {
        setError(data.errors.map((e: { row: number; message: string }) => `第 ${e.row} 列：${e.message}`).join("；"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "送出失敗");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="批次登記"
        description="效期／報廢批次、條碼掃描與 Excel 匯入（需先預覽再確認寫入）"
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-[12px] px-3 py-2 text-sm font-semibold",
              tab === t.id
                ? "bg-[#6F4E37] text-white"
                : "border border-[#E9DED4] bg-white text-[#2F2925]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === "expiry" || tab === "scan") && (
        <AdminBarcodeInput onSelect={addExpiryFromProduct} autoFocus={tab === "scan"} />
      )}
      {tab === "disposal" && (
        <AdminBarcodeInput onSelect={addDisposalFromProduct} />
      )}

      {tab === "expiry" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setExpiryRows((prev) => {
                  const last = prev[prev.length - 1];
                  if (!last) return prev;
                  return [...prev, { ...last, key: newKey() }];
                })
              }
              disabled={!expiryRows.length}
            >
              複製上一列
            </Button>
            <Button type="button" onClick={() => void submitExpiry()} disabled={!expiryRows.length || submitting}>
              批次送出效期
            </Button>
          </div>
          <div className="overflow-x-auto rounded-[16px] border border-[#E9DED4] bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[#FAF6F1] text-left text-[#756B64]">
                <tr>
                  <th className="px-3 py-2">商品</th>
                  <th className="px-3 py-2">數量</th>
                  <th className="px-3 py-2">效期</th>
                  <th className="px-3 py-2">批號</th>
                  <th className="px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {expiryRows.map((row, idx) => (
                  <tr key={row.key} className="border-t border-[#E9DED4]">
                    <td className="px-3 py-2">
                      <p className="font-medium">{row.product_name}</p>
                      <p className="text-xs text-[#756B64]">{row.barcode || row.product_id}</p>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        value={row.quantity}
                        onChange={(e) =>
                          setExpiryRows((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, quantity: e.target.value } : r))
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="date"
                        value={row.expiry_date}
                        onChange={(e) =>
                          setExpiryRows((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, expiry_date: e.target.value } : r))
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={row.batch_no}
                        onChange={(e) =>
                          setExpiryRows((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, batch_no: e.target.value } : r))
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setExpiryRows((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        刪除
                      </Button>
                    </td>
                  </tr>
                ))}
                {!expiryRows.length ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-[#756B64]">
                      先掃描條碼加入列
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "disposal" && (
        <div className="space-y-3">
          <Button type="button" onClick={() => void submitDisposal()} disabled={!disposalRows.length || submitting}>
            批次送出報廢
          </Button>
          <div className="overflow-x-auto rounded-[16px] border border-[#E9DED4] bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[#FAF6F1] text-left text-[#756B64]">
                <tr>
                  <th className="px-3 py-2">商品</th>
                  <th className="px-3 py-2">數量</th>
                  <th className="px-3 py-2">成本</th>
                  <th className="px-3 py-2">原因</th>
                  <th className="px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {disposalRows.map((row, idx) => (
                  <tr key={row.key} className="border-t border-[#E9DED4]">
                    <td className="px-3 py-2 font-medium">{row.product_name}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        value={row.quantity}
                        onChange={(e) =>
                          setDisposalRows((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, quantity: e.target.value } : r))
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        value={row.unit_cost}
                        onChange={(e) =>
                          setDisposalRows((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, unit_cost: e.target.value } : r))
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={row.reason}
                        onChange={(e) =>
                          setDisposalRows((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, reason: e.target.value } : r))
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDisposalRows((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        刪除
                      </Button>
                    </td>
                  </tr>
                ))}
                {!disposalRows.length ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-[#756B64]">
                      先掃描條碼加入報廢列
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "import" && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 font-semibold text-[#2F2925]">效期 Excel 匯入</h2>
            <AdminImportPreview importType="expiry" />
          </div>
          <div>
            <h2 className="mb-2 font-semibold text-[#2F2925]">報廢 Excel 匯入</h2>
            <AdminImportPreview importType="disposal" />
          </div>
        </div>
      )}

      {tab === "scan" && (
        <p className="text-sm text-[#756B64]">
          掃描後會加入「效期批次登記」列表。重複商品會提示是否累加數量。
        </p>
      )}

      {msg ? <p className="text-sm text-[#2E7D5B]">{msg}</p> : null}
      {error ? <p className="text-sm text-[#C94C4C]">{error}</p> : null}
    </div>
  );
}

export default function StoreBatchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#756B64]">載入中…</p>}>
      <BatchPageInner />
    </Suspense>
  );
}
