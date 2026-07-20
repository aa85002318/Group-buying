"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/site-links";

type Sub = {
  new_products: boolean;
  livestreams: boolean;
  courses: boolean;
  newsletter: boolean;
};

const LABELS: Array<{ key: keyof Sub; label: string; desc: string }> = [
  { key: "new_products", label: "新品通知", desc: "新商品與團購上架" },
  { key: "livestreams", label: "直播通知", desc: "直播開始提醒" },
  { key: "courses", label: "老師課程", desc: "課程開課與名額提醒" },
  { key: "newsletter", label: "電子報", desc: "烘焙知識與活動電子報" },
];

export default function SubscriptionSettingsPage() {
  const [sub, setSub] = useState<Sub>({
    new_products: true,
    livestreams: true,
    courses: true,
    newsletter: false,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/member/subscriptions")
      .then((r) => r.json())
      .then((d) => {
        if (d.subscription) {
          setSub({
            new_products: d.subscription.new_products ?? true,
            livestreams: d.subscription.livestreams ?? true,
            courses: d.subscription.courses ?? true,
            newsletter: d.subscription.newsletter ?? false,
          });
        }
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/member/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMsg("訂閱設定已儲存");
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequireAuth>
      <div className="space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.member} className="text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-black text-foreground">訂閱通知</h1>
        </div>
        <p className="text-sm text-foreground-secondary">
          裝置推播將於後續版本開放；此處管理 App 內／Email 訂閱偏好。
        </p>
        <div className="space-y-3">
          {LABELS.map((item) => (
            <label key={item.key} className="card-surface flex items-center justify-between gap-3 p-4">
              <span>
                <span className="block font-bold text-foreground">{item.label}</span>
                <span className="text-xs text-foreground-secondary">{item.desc}</span>
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                checked={sub[item.key]}
                onChange={(e) => setSub({ ...sub, [item.key]: e.target.checked })}
              />
            </label>
          ))}
        </div>
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving ? "儲存中…" : "儲存"}
        </Button>
      </div>
    </RequireAuth>
  );
}
