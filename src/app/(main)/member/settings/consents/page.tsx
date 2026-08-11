"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/site-links";

type Consent = {
  document_key: string;
  document_version: string;
  agreed: boolean;
  agreed_at: string;
};

const DOC_LABELS: Record<string, string> = {
  privacy: "隱私權政策",
  terms: "會員條款",
  marketing: "行銷訊息同意",
};

export default function ConsentsPage() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/member/consents")
      .then((r) => r.json())
      .then((d) => setConsents(d.consents ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const record = async (documentKey: string) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/member/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentKey, agreed: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "紀錄失敗");
      setMessage("同意紀錄已更新");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "紀錄失敗");
    } finally {
      setSaving(false);
    }
  };

  const latestByKey = (key: string) =>
    consents.find((c) => c.document_key === key);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.memberSettings}>
            <ArrowLeft className="h-5 w-5 text-caramel" />
          </Link>
          <h1 className="text-xl font-bold text-caramel">同意紀錄</h1>
        </div>

        <div className="space-y-3 rounded-[20px] bg-surface p-5 shadow-card">
          <p className="text-sm text-foreground-secondary">
            查閱隱私權政策與會員條款的同意時間與版本。行銷偏好請至「行銷訊息同意」。
          </p>

          {loading ? (
            <p className="text-sm text-foreground-secondary">載入中…</p>
          ) : (
            (["privacy", "terms"] as const).map((key) => {
              const item = latestByKey(key);
              return (
                <div key={key} className="rounded-xl border border-border/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{DOC_LABELS[key]}</p>
                      {item ? (
                        <p className="mt-1 text-xs text-foreground-secondary">
                          版本 {item.document_version}｜
                          {item.agreed ? "已同意" : "未同意"}｜
                          {new Date(item.agreed_at).toLocaleString("zh-TW")}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-foreground-secondary">尚無紀錄</p>
                      )}
                      <Link
                        href={key === "privacy" ? APP_ROUTES.privacy : APP_ROUTES.terms}
                        className="mt-2 inline-block text-xs text-caramel underline"
                      >
                        查看全文
                      </Link>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => record(key)}
                    >
                      重新確認同意
                    </Button>
                  </div>
                </div>
              );
            })
          )}

          {error && <p className="text-sm text-error">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
        </div>
      </div>
    </RequireAuth>
  );
}
