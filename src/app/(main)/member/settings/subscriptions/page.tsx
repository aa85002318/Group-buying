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

type Marketing = {
  email: boolean;
  line: boolean;
  sms: boolean;
};

const SUB_LABELS: Array<{ key: keyof Sub; label: string; desc: string }> = [
  { key: "new_products", label: "新品通知", desc: "新商品與團購上架" },
  { key: "livestreams", label: "直播通知", desc: "直播開始提醒" },
  { key: "courses", label: "老師課程", desc: "課程開課與名額提醒" },
  { key: "newsletter", label: "電子報", desc: "烘焙知識與活動電子報" },
];

const MARKETING_LABELS: Array<{ key: keyof Marketing; label: string; desc: string }> = [
  { key: "email", label: "Email 行銷", desc: "同意以 Email 收到優惠與活動訊息" },
  { key: "line", label: "LINE 行銷", desc: "同意以 LINE 收到優惠與活動訊息" },
  { key: "sms", label: "簡訊行銷", desc: "同意以簡訊收到優惠與活動訊息" },
];

export default function SubscriptionSettingsPage() {
  const [sub, setSub] = useState<Sub>({
    new_products: true,
    livestreams: true,
    courses: true,
    newsletter: false,
  });
  const [marketing, setMarketing] = useState<Marketing>({
    email: false,
    line: false,
    sms: false,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/member/subscriptions").then((r) => r.json()),
      fetch("/api/member/consents").then((r) => r.json()),
    ])
      .then(([subRes, consentRes]) => {
        if (subRes.subscription) {
          setSub({
            new_products: subRes.subscription.new_products ?? true,
            livestreams: subRes.subscription.livestreams ?? true,
            courses: subRes.subscription.courses ?? true,
            newsletter: subRes.subscription.newsletter ?? false,
          });
        }
        if (consentRes.marketing) {
          setMarketing({
            email: Boolean(consentRes.marketing.email),
            line: Boolean(consentRes.marketing.line),
            sms: Boolean(consentRes.marketing.sms),
          });
        }
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const [subRes, mktRes] = await Promise.all([
        fetch("/api/member/subscriptions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        }),
        fetch("/api/member/consents", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(marketing),
        }),
      ]);
      if (!subRes.ok) throw new Error((await subRes.json()).error);
      if (!mktRes.ok) throw new Error((await mktRes.json()).error);
      setMsg("設定已儲存");
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.memberSettings} className="text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-black text-foreground">行銷與訂閱</h1>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-caramel">行銷訊息同意</h2>
          <p className="text-sm text-foreground-secondary">
            您可隨時同意或不同意各通路行銷訊息。
          </p>
          {MARKETING_LABELS.map((item) => (
            <label key={item.key} className="card-surface flex items-center justify-between gap-3 p-4">
              <span>
                <span className="block font-bold text-foreground">{item.label}</span>
                <span className="text-xs text-foreground-secondary">{item.desc}</span>
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                checked={marketing[item.key]}
                onChange={(e) =>
                  setMarketing({ ...marketing, [item.key]: e.target.checked })
                }
              />
            </label>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-caramel">訂閱主題</h2>
          {SUB_LABELS.map((item) => (
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
        </section>

        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving ? "儲存中…" : "儲存"}
        </Button>
      </div>
    </RequireAuth>
  );
}
