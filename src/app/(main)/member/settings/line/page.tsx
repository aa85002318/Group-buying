"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/site-links";

type Binding = {
  lineUserId: string;
  boundAt: string;
} | null;

export default function LineSettingsPage() {
  const [binding, setBinding] = useState<Binding>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/member/line-binding")
      .then((r) => r.json())
      .then((d) => setBinding(d.binding ?? null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const unbind = async () => {
    if (!confirm("確定要解除 LINE 綁定嗎？")) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/member/line-binding", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "解除失敗");
      setBinding(null);
      setMessage("已解除 LINE 綁定");
    } catch (err) {
      setError(err instanceof Error ? err.message : "解除失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.memberSettings}>
            <ArrowLeft className="h-5 w-5 text-caramel" />
          </Link>
          <h1 className="text-xl font-bold text-caramel">LINE 綁定</h1>
        </div>

        <div className="space-y-4 rounded-[20px] bg-surface p-5 shadow-card">
          {loading ? (
            <p className="text-sm text-foreground-secondary">載入中…</p>
          ) : binding ? (
            <>
              <p className="text-sm text-foreground">
                已綁定 LINE
                <span className="mt-1 block text-xs text-foreground-secondary">
                  ID：{binding.lineUserId.slice(0, 8)}…
                </span>
                <span className="block text-xs text-foreground-secondary">
                  綁定時間：{new Date(binding.boundAt).toLocaleString("zh-TW")}
                </span>
              </p>
              <Button
                variant="outline"
                className="min-h-11 w-full border-error text-error"
                disabled={busy}
                onClick={unbind}
              >
                {busy ? "處理中…" : "解除綁定"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-foreground-secondary">
                尚未綁定 LINE。綁定後可用 LINE 登入並接收通知。
              </p>
              <a
                href={`/api/line/oauth/start?next=${encodeURIComponent(APP_ROUTES.memberLineSettings)}`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#06C755] px-4 text-sm font-medium text-white"
              >
                綁定 LINE
              </a>
            </>
          )}
          {error && <p className="text-sm text-error">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
        </div>
      </div>
    </RequireAuth>
  );
}
