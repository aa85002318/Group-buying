"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/site-links";

type Prefs = {
  order_updates: boolean;
  pickup_reminders: boolean;
  new_products: boolean;
  closing_soon: boolean;
  livestreams: boolean;
  marketing: boolean;
};

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>({
    order_updates: true,
    pickup_reminders: true,
    new_products: true,
    closing_soon: true,
    livestreams: true,
    marketing: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/member/notification-preferences")
      .then((r) => r.json())
      .then((d) => { if (d.preferences) setPrefs(d.preferences); });
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/member/notification-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggles: Array<{ key: keyof Prefs; label: string }> = [
    { key: "order_updates", label: "訂單狀態通知" },
    { key: "pickup_reminders", label: "取貨提醒" },
    { key: "new_products", label: "新品上架" },
    { key: "closing_soon", label: "即將收單" },
    { key: "livestreams", label: "直播提醒" },
    { key: "marketing", label: "活動與行銷資訊" },
  ];

  return (
    <RequireAuth>
      <div className="space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.member}><ArrowLeft className="h-5 w-5 text-[#173F75]" /></Link>
          <h1 className="text-xl font-bold text-[#173F75]">通知設定</h1>
        </div>

        <div className="space-y-3 rounded-[20px] bg-surface p-5 shadow-[0_4px_24px_rgba(23,63,117,0.06)]">
          {toggles.map((t) => (
            <label key={t.key} className="flex min-h-11 items-center justify-between gap-3">
              <span className="text-foreground">{t.label}</span>
              <input type="checkbox" checked={prefs[t.key]} onChange={(e) => setPrefs({ ...prefs, [t.key]: e.target.checked })} />
            </label>
          ))}
          <p className="text-xs text-foreground-secondary">關閉 App 內通知後，部分重要訂單狀態仍可能顯示於訂單頁面。</p>
          <p className="text-xs text-foreground-secondary">裝置推播功能將於後續版本開放。</p>
          {saved && <p className="text-sm text-green-700">已儲存</p>}
          <Button className="min-h-11 w-full bg-primary" onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存設定"}</Button>
        </div>
      </div>
    </RequireAuth>
  );
}
