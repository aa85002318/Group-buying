"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeMobileBarcode } from "@/lib/validation/invoice-carrier";

type CarrierFormProps = {
  mode: "create" | "edit";
  initialName?: string;
  initialCode?: string;
  onSubmit: (data: { carrier_name: string; carrier_code: string }) => Promise<void>;
  onCancel: () => void;
};

export function CarrierForm({ mode, initialName = "", initialCode = "", onSubmit, onCancel }: CarrierFormProps) {
  const [carrierName, setCarrierName] = useState(initialName || "我的手機條碼");
  const [carrierCode, setCarrierCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCodeChange = (value: string) => {
    setCarrierCode(normalizeMobileBarcode(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        carrier_name: carrierName.trim() || "我的手機條碼",
        carrier_code: carrierCode,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[20px] bg-white p-5 shadow-[0_4px_24px_rgba(23,63,117,0.06)]">
      <h2 className="text-lg font-bold text-[#173F75]">{mode === "create" ? "新增手機條碼" : "編輯載具"}</h2>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#202124]">
          載具名稱 <span className="text-[#6B7280]">（選填）</span>
        </label>
        <Input
          value={carrierName}
          onChange={(e) => setCarrierName(e.target.value.slice(0, 30))}
          placeholder="我的手機條碼"
          className="min-h-12"
          maxLength={30}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#202124]">
          手機條碼 <span className="text-[#E9285C]">*</span>
        </label>
        <Input
          value={carrierCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="/ABC1234"
          className="min-h-12 font-mono uppercase"
          required
          autoComplete="off"
          spellCheck={false}
        />
        <p className="mt-1 text-xs text-[#6B7280]">請輸入以 / 開頭的 8 碼手機條碼</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[#DC2626]">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving} className="min-h-11 flex-1 bg-[#E9285C] hover:bg-[#D01F50]">
          {saving ? "儲存中…" : "儲存"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="min-h-11">
          取消
        </Button>
      </div>
    </form>
  );
}
