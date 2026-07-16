"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { EcpayEnvironment, EcpaySettingsPublicView } from "@/lib/ecpay/settings";

type FormState = {
  paymentEnabled: boolean;
  environment: EcpayEnvironment;
  merchantId: string;
  hashKey: string;
  hashIv: string;
  creditCardEnabled: boolean;
  atmEnabled: boolean;
  cvsPaymentEnabled: boolean;
  logisticsEnabled: boolean;
  homeDeliveryEnabled: boolean;
  cvsPickupEnabled: boolean;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  logisticsMerchantId: string;
  adminNotes: string;
};

const emptyForm: FormState = {
  paymentEnabled: false,
  environment: "stage",
  merchantId: "",
  hashKey: "",
  hashIv: "",
  creditCardEnabled: true,
  atmEnabled: false,
  cvsPaymentEnabled: false,
  logisticsEnabled: false,
  homeDeliveryEnabled: false,
  cvsPickupEnabled: false,
  senderName: "",
  senderPhone: "",
  senderAddress: "",
  logisticsMerchantId: "",
  adminNotes: "",
};

function CheckRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-coffee">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border"
      />
      {label}
    </label>
  );
}

export default function AdminEcpayIntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<EcpaySettingsPublicView | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/integrations/ecpay")
      .then((r) => r.json())
      .then((d: EcpaySettingsPublicView & { error?: string }) => {
        if (d.error) throw new Error(d.error);
        setView(d);
        setForm({
          paymentEnabled: d.paymentEnabled,
          environment: d.environment,
          merchantId: d.merchantId,
          hashKey: "",
          hashIv: "",
          creditCardEnabled: d.creditCardEnabled,
          atmEnabled: d.atmEnabled,
          cvsPaymentEnabled: d.cvsPaymentEnabled,
          logisticsEnabled: d.logisticsEnabled,
          homeDeliveryEnabled: d.homeDeliveryEnabled,
          cvsPickupEnabled: d.cvsPickupEnabled,
          senderName: d.senderName,
          senderPhone: d.senderPhone,
          senderAddress: d.senderAddress,
          logisticsMerchantId: d.logisticsMerchantId,
          adminNotes: d.adminNotes,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/integrations/ecpay", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setView(data);
      setForm((prev) => ({ ...prev, hashKey: "", hashIv: "" }));
      setMessage("已儲存綠界設定");
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">載入綠界設定…</p>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="綠界金流／物流"
        description="填寫特店資訊、回調網址與啟用項目。正式刷卡／物流開通後，結帳頁才會開放對應選項。"
      />

      {message && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      {view && (
        <section className="grid gap-3 rounded-xl border border-border bg-white p-4 shadow-card sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">金流就緒</p>
            <p className={`text-sm font-semibold ${view.readiness.paymentReady ? "text-brand-success" : "text-countdown"}`}>
              {view.readiness.paymentReady ? "可測試開通" : "尚未就緒"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">物流就緒</p>
            <p className={`text-sm font-semibold ${view.readiness.logisticsReady ? "text-brand-success" : "text-countdown"}`}>
              {view.readiness.logisticsReady ? "可測試開通" : "尚未就緒"}
            </p>
          </div>
          {view.readiness.missing.length > 0 && (
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs font-medium text-muted-foreground">尚缺項目</p>
              <ul className="list-disc pl-5 text-sm text-countdown">
                {view.readiness.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="space-y-4 rounded-xl border border-border bg-white p-4 shadow-card">
        <h2 className="font-semibold text-coffee">一、串接前準備（綠界後台）</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            至{" "}
            <a
              href="https://www.ecpay.com.tw/"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              綠界科技
            </a>{" "}
            申請特店／金流＋物流服務
          </li>
          <li>取得測試／正式環境的 MerchantID、HashKey、HashIV</li>
          <li>在綠界商家後台登記下方「回調網址」</li>
          <li>先用測試環境打通，再切換正式環境</li>
        </ol>
      </section>

      {view && (
        <section className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-card">
          <h2 className="font-semibold text-coffee">二、回調網址（請複製到綠界後台）</h2>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">付款完成／NotifyURL</p>
              <code className="mt-0.5 block break-all rounded-lg bg-muted px-3 py-2 text-xs">
                {view.callbackUrls.paymentNotify}
              </code>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">物流狀態 NotifyURL</p>
              <code className="mt-0.5 block break-all rounded-lg bg-muted px-3 py-2 text-xs">
                {view.callbackUrls.logisticsNotify}
              </code>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">目前閘道（依環境）</p>
              <code className="mt-0.5 block break-all rounded-lg bg-muted px-3 py-2 text-xs">
                金流：{view.gatewayUrls.payment}
              </code>
              <code className="mt-0.5 block break-all rounded-lg bg-muted px-3 py-2 text-xs">
                物流：{view.gatewayUrls.logistics}
              </code>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-xl border border-border bg-white p-4 shadow-card">
        <h2 className="font-semibold text-coffee">三、特店憑證</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            環境
            <select
              className="mt-1 h-10 w-full rounded-input border border-border bg-white px-3"
              value={form.environment}
              onChange={(e) =>
                setForm({ ...form, environment: e.target.value as EcpayEnvironment })
              }
            >
              <option value="stage">測試環境（stage）</option>
              <option value="production">正式環境（production）</option>
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            特店編號 MerchantID
            <Input
              className="mt-1"
              value={form.merchantId}
              onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
              placeholder="例如 3002607"
            />
          </label>
          <label className="block text-sm">
            HashKey
            <Input
              className="mt-1"
              type="password"
              autoComplete="off"
              value={form.hashKey}
              onChange={(e) => setForm({ ...form, hashKey: e.target.value })}
              placeholder={view?.hashKeyConfigured ? `已設定：${view.hashKeyMasked}` : "貼上 HashKey"}
            />
            <span className="mt-1 block text-xs text-muted-foreground">留空則保留原設定</span>
          </label>
          <label className="block text-sm">
            HashIV
            <Input
              className="mt-1"
              type="password"
              autoComplete="off"
              value={form.hashIv}
              onChange={(e) => setForm({ ...form, hashIv: e.target.value })}
              placeholder={view?.hashIvConfigured ? `已設定：${view.hashIvMasked}` : "貼上 HashIV"}
            />
            <span className="mt-1 block text-xs text-muted-foreground">留空則保留原設定</span>
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-card">
        <h2 className="font-semibold text-coffee">四、金流啟用</h2>
        <CheckRow
          checked={form.paymentEnabled}
          label="啟用綠界線上付款（結帳顯示信用卡等選項）"
          onChange={(v) => setForm({ ...form, paymentEnabled: v })}
        />
        <div className="ml-1 space-y-2 border-l-2 border-brand-blush pl-4">
          <CheckRow
            checked={form.creditCardEnabled}
            label="信用卡"
            onChange={(v) => setForm({ ...form, creditCardEnabled: v })}
          />
          <CheckRow
            checked={form.atmEnabled}
            label="ATM 虛擬帳號"
            onChange={(v) => setForm({ ...form, atmEnabled: v })}
          />
          <CheckRow
            checked={form.cvsPaymentEnabled}
            label="超商代碼繳費"
            onChange={(v) => setForm({ ...form, cvsPaymentEnabled: v })}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-card">
        <h2 className="font-semibold text-coffee">五、物流啟用</h2>
        <CheckRow
          checked={form.logisticsEnabled}
          label="啟用綠界物流（宅配／超商取貨）"
          onChange={(v) => setForm({ ...form, logisticsEnabled: v })}
        />
        <div className="ml-1 space-y-2 border-l-2 border-brand-blush pl-4">
          <CheckRow
            checked={form.homeDeliveryEnabled}
            label="宅配到府"
            onChange={(v) => setForm({ ...form, homeDeliveryEnabled: v })}
          />
          <CheckRow
            checked={form.cvsPickupEnabled}
            label="超商取貨（7-11／全家等）"
            onChange={(v) => setForm({ ...form, cvsPickupEnabled: v })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            寄件人姓名
            <Input
              className="mt-1"
              value={form.senderName}
              onChange={(e) => setForm({ ...form, senderName: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            寄件人電話
            <Input
              className="mt-1"
              value={form.senderPhone}
              onChange={(e) => setForm({ ...form, senderPhone: e.target.value })}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            寄件地址
            <Input
              className="mt-1"
              value={form.senderAddress}
              onChange={(e) => setForm({ ...form, senderAddress: e.target.value })}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            物流特店編號（若與金流不同再填）
            <Input
              className="mt-1"
              value={form.logisticsMerchantId}
              onChange={(e) => setForm({ ...form, logisticsMerchantId: e.target.value })}
              placeholder="可留空，預設使用上方 MerchantID"
            />
          </label>
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-border bg-white p-4 shadow-card">
        <h2 className="font-semibold text-coffee">六、內部備註</h2>
        <textarea
          className="min-h-[88px] w-full rounded-input border border-border px-3 py-2 text-sm"
          value={form.adminNotes}
          onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
          placeholder="例如：測試帳號、綠界客服單號、預計開通日…"
        />
      </section>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "儲存中…" : "儲存設定"}
        </Button>
        <Button variant="outline" onClick={load} disabled={saving}>
          重新載入
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        說明：此頁完成「憑證與開關」管道。實際導向綠界付款／建立物流單的程式會依此設定啟用；開通前結帳仍以門市付款／轉帳／門市取貨為主。
      </p>
    </div>
  );
}
